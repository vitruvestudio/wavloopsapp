/**
 * /contacts — Producer's master address book.
 *
 * Server component. Post-migration #7 contacts live at the producer
 * level (UNIQUE owner_id, email), so no JS dedupe is needed: one
 * `contacts` row IS the rendered row. The `server_contacts` pivot
 * tells us which server(s) each contact has access to — joined in
 * directly via PostgREST.
 *
 * Three parallel queries:
 *   1. contacts ⨝ server_contacts ⨝ servers — one row per contact,
 *      `servers_in: ServerStub[]` flattened in JS.
 *   2. listens(contact_id) — sum to per-contact play counts.
 *   3. likes(contact_id)   — sum to per-contact like counts.
 *
 * Plus a fourth, lighter query for the producer's full server list
 * (used by the Add Contact modal's "Add to servers" chips, AND the
 * toolbar's All-servers dropdown).
 *
 * V1 scale (<<10k contacts/producer) keeps the JS pass trivial.
 */

import { createClient } from "@/lib/supabase/server";
import { ContactsPage } from "./ContactsPage";

export const metadata = { title: "Contacts" };

/** One PostgREST join row — contact + nested array of server stubs. */
interface ContactJoinRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  socials: Record<string, string>;
  avatar_url: string | null;
  first_seen_at: string;
  last_active_at: string;
  server_contacts: Array<{
    servers: { id: string; name: string; slug: string } | null;
  }>;
}

/** Rendered shape — flat, one per contact. */
export interface ContactRowVM {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  socials: Record<string, string>;
  avatarUrl: string | null;
  firstSeenAt: string;
  servers: Array<{ id: string; name: string; slug: string }>;
  plays: number;
  likes: number;
}

/** Lightweight stub for the modal's "Add to servers" chips. */
export interface ServerStub {
  id: string;
  name: string;
  slug: string;
}

export default async function ContactsRoute() {
  const supabase = await createClient();

  const [contactsRes, listensRes, likesRes, serversRes] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, email, name, phone, socials, avatar_url, first_seen_at, last_active_at, server_contacts(servers(id, name, slug))",
      )
      .order("last_active_at", { ascending: false })
      .returns<ContactJoinRow[]>(),
    supabase.from("listens").select("contact_id"),
    supabase.from("likes").select("contact_id"),
    supabase
      .from("servers")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .returns<ServerStub[]>(),
  ]);

  // contact_id → engagement
  const playsBy = new Map<string, number>();
  for (const l of listensRes.data ?? []) {
    if (!l.contact_id) continue;
    playsBy.set(l.contact_id, (playsBy.get(l.contact_id) ?? 0) + 1);
  }
  const likesBy = new Map<string, number>();
  for (const l of likesRes.data ?? []) {
    if (!l.contact_id) continue;
    likesBy.set(l.contact_id, (likesBy.get(l.contact_id) ?? 0) + 1);
  }

  const contacts: ContactRowVM[] = (contactsRes.data ?? []).map((row) => {
    const servers = row.server_contacts
      .map((sc) => sc.servers)
      .filter((s): s is ServerStub => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      socials: row.socials,
      avatarUrl: row.avatar_url,
      firstSeenAt: row.first_seen_at,
      servers,
      plays: playsBy.get(row.id) ?? 0,
      likes: likesBy.get(row.id) ?? 0,
    };
  });

  return (
    <ContactsPage
      contacts={contacts}
      allServers={serversRes.data ?? []}
    />
  );
}
