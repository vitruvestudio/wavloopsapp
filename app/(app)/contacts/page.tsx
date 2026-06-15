/**
 * /contacts — Producer's master contacts list.
 *
 * Server component. Aggregates the producer's contacts ACROSS all
 * their servers, deduplicating by email. RLS scopes the underlying
 * `contacts`, `listens`, `likes` queries to the producer's own
 * servers, so we don't need an explicit owner filter.
 *
 * Why this page exists separately from the per-server Artists tab:
 *   - Producers think in terms of people they've reached, not
 *     individual server memberships.
 *   - Same artist may sit in 3 servers — they should appear once.
 *   - Page-level Import / Export / Add operate cross-server.
 *
 * Aggregation strategy (3 parallel queries, JS group-by):
 *   1. `contacts` + `servers` join → all per-(server, email) rows
 *      with their server name + slug
 *   2. `listens(contact_id)` flat → count per contact_id in JS
 *   3. `likes(contact_id)`   flat → count per contact_id in JS
 *
 * Then dedupe by email:
 *   - earliest first_seen_at wins
 *   - phone / name = first non-null
 *   - servers = union, ordered alpha by name
 *   - plays / likes = sum across all contact_ids tied to this email
 *
 * V1 scale (<<10k contacts/producer) makes the JS pass trivial.
 * When this matures we'll fold the aggregate into a `contacts_with_stats`
 * view.
 */

import { createClient } from "@/lib/supabase/server";
import { ContactsPage } from "./ContactsPage";
import type { ContactRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Contacts" };

/** Per-server, per-email contact + the server's display info. */
interface ContactJoinRow extends ContactRow {
  servers: { id: string; name: string; slug: string } | null;
}

/** What the client renders for one row. */
export interface AggregatedContact {
  /** Stable dedupe key. */
  email: string;
  name: string | null;
  phone: string | null;
  /** Earliest entry across all servers — used to label "ENTERED 2D AGO". */
  firstSeenAt: string;
  /** Distinct servers the contact belongs to, alpha-sorted. */
  servers: Array<{ id: string; name: string; slug: string }>;
  plays: number;
  likes: number;
}

export default async function ContactsRoute() {
  const supabase = await createClient();

  const [contactsRes, listensRes, likesRes] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, server_id, email, name, phone, socials, first_seen_at, last_active_at, servers!inner(id, name, slug)",
      )
      .returns<ContactJoinRow[]>(),
    supabase.from("listens").select("contact_id"),
    supabase.from("likes").select("contact_id"),
  ]);

  // contact_id → engagement counts
  const playsByContactId = new Map<string, number>();
  for (const l of listensRes.data ?? []) {
    if (!l.contact_id) continue;
    playsByContactId.set(
      l.contact_id,
      (playsByContactId.get(l.contact_id) ?? 0) + 1,
    );
  }
  const likesByContactId = new Map<string, number>();
  for (const l of likesRes.data ?? []) {
    if (!l.contact_id) continue;
    likesByContactId.set(
      l.contact_id,
      (likesByContactId.get(l.contact_id) ?? 0) + 1,
    );
  }

  // Group rows by email.
  const byEmail = new Map<string, AggregatedContact>();
  const serverIdsTouched = new Set<string>();
  for (const row of contactsRes.data ?? []) {
    if (row.servers) serverIdsTouched.add(row.servers.id);
    const existing = byEmail.get(row.email);
    const plays = playsByContactId.get(row.id) ?? 0;
    const likes = likesByContactId.get(row.id) ?? 0;
    if (!existing) {
      byEmail.set(row.email, {
        email: row.email,
        name: row.name,
        phone: row.phone,
        firstSeenAt: row.first_seen_at,
        servers: row.servers
          ? [{ id: row.servers.id, name: row.servers.name, slug: row.servers.slug }]
          : [],
        plays,
        likes,
      });
    } else {
      existing.name = existing.name ?? row.name;
      existing.phone = existing.phone ?? row.phone;
      if (row.first_seen_at < existing.firstSeenAt) {
        existing.firstSeenAt = row.first_seen_at;
      }
      if (
        row.servers &&
        !existing.servers.find((s) => s.id === row.servers!.id)
      ) {
        existing.servers.push({
          id: row.servers.id,
          name: row.servers.name,
          slug: row.servers.slug,
        });
      }
      existing.plays += plays;
      existing.likes += likes;
    }
  }

  // Stable display order for the server tags inside each row.
  for (const c of byEmail.values()) {
    c.servers.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Distinct list of servers across the WHOLE contact set — feeds
  // the "All servers" dropdown.
  const allServers = new Map<string, { id: string; name: string; slug: string }>();
  for (const c of byEmail.values()) {
    for (const s of c.servers) allServers.set(s.id, s);
  }

  return (
    <ContactsPage
      contacts={Array.from(byEmail.values())}
      allServers={Array.from(allServers.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      )}
    />
  );
}
