-- Wavloops V3 — migration #7.
-- Contacts refactor: contacts become OWNER-scoped (the producer's
-- address book), and `server_contacts` becomes the pivot that says
-- which contact has access to which server.
--
-- Why
-- ──
-- The original `contacts` table tied each contact to a single
-- server_id. That made "save a contact without attaching them to a
-- server yet" impossible, and forced the producer's contacts page
-- to dedupe by email at read time. The Add Contact modal's
-- "ADD TO SERVERS · OPTIONAL" + "SAVED TO YOUR ADDRESS BOOK" copy
-- requires the contact to exist independently. This migration
-- changes the data model to match.
--
-- New shape
-- ─────────
--   contacts (id, owner_id, email, name, phone, socials, first_seen_at,
--             last_active_at)         — UNIQUE (owner_id, email)
--
--   server_contacts (server_id, contact_id, granted_at)
--                                     — PK (server_id, contact_id)
--
--   listens / likes — recreated with FK to the new contacts table.
--                     (CASCADE on the old contacts drop wiped the
--                      tables anyway, so we recreate them fresh.)
--
-- Safe to run NOW
-- ───────────────
-- At the time of writing every producer has 0 contacts in prod, so
-- the destructive cascade is harmless. Once contacts data lands,
-- DO NOT re-run this migration — it WILL wipe contact/listen/like
-- rows. This is the one-time MVP cutover; future contact-shape
-- changes go through ALTER TABLE.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 0. Drop everything that depended on the old contacts shape.
--    CASCADE on contacts also drops the FK constraints from
--    listens.contact_id / likes.contact_id, but we drop those
--    tables explicitly first to keep the order obvious.
-- ============================================================
drop table if exists public.likes cascade;
drop table if exists public.listens cascade;
drop table if exists public.server_contacts cascade;
drop table if exists public.contacts cascade;

-- ============================================================
-- 1. contacts — top-level, owner-scoped
-- ============================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  name text,
  phone text,
  /* { instagram: "@kayde", x: "@kayde", youtube: "@kayde",
       genius: "@kayde", website: "https://kayde.co" } — all keys
     optional, validated app-side */
  socials jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  unique (owner_id, email)
);

create index contacts_owner_idx on public.contacts (owner_id);
create index contacts_last_active_idx
  on public.contacts (owner_id, last_active_at desc);

alter table public.contacts enable row level security;

drop policy if exists contacts_owner_all on public.contacts;
create policy contacts_owner_all on public.contacts
  for all to authenticated
  using (owner_id = current_profile_id())
  with check (owner_id = current_profile_id());

-- ============================================================
-- 2. server_contacts — pivot
-- ============================================================
create table public.server_contacts (
  server_id uuid not null references public.servers (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (server_id, contact_id)
);

create index server_contacts_contact_idx
  on public.server_contacts (contact_id);

alter table public.server_contacts enable row level security;

-- Producer reads + writes the pivot for their own servers. RLS on
-- both sides (servers + contacts) already gates the rows, but the
-- explicit EXISTS check on `servers` keeps the policy fast (one
-- index seek per row).
drop policy if exists server_contacts_owner_all on public.server_contacts;
create policy server_contacts_owner_all on public.server_contacts
  for all to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = server_contacts.server_id
        and s.owner_id = current_profile_id()
    )
  )
  with check (
    exists (
      select 1 from public.servers s
      where s.id = server_contacts.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- ============================================================
-- 3. listens — recreated, FK now points to the new contacts
-- ============================================================
create table public.listens (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  server_id uuid not null references public.servers (id) on delete cascade,
  listened_at timestamptz not null default now(),
  completion_pct real check (completion_pct >= 0 and completion_pct <= 1)
);

create index listens_server_listened_idx
  on public.listens (server_id, listened_at desc);
create index listens_beat_idx on public.listens (beat_id);

alter table public.listens enable row level security;

drop policy if exists listens_owner_select on public.listens;
create policy listens_owner_select on public.listens
  for select to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = listens.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- ============================================================
-- 4. likes — recreated, FK now points to the new contacts
-- ============================================================
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  server_id uuid not null references public.servers (id) on delete cascade,
  liked_at timestamptz not null default now(),
  unique (contact_id, beat_id)
);

create index likes_server_idx on public.likes (server_id);
create index likes_beat_idx on public.likes (beat_id);

alter table public.likes enable row level security;

drop policy if exists likes_owner_select on public.likes;
create policy likes_owner_select on public.likes
  for select to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = likes.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- ============================================================
-- 5. Patch the servers_with_stats view — contacts_count now goes
--    through the new pivot table.
-- ============================================================
create or replace view public.servers_with_stats
with (security_invoker = true) as
select
  s.*,
  coalesce(b.count, 0)::int as beats_count,
  coalesce(c.count, 0)::int as contacts_count,
  coalesce(l.count, 0)::int as plays_count
from public.servers s
left join lateral (
  select count(*)::int as count
  from public.server_beats sb
  where sb.server_id = s.id
) b on true
left join lateral (
  select count(*)::int as count
  from public.server_contacts sc
  where sc.server_id = s.id
) c on true
left join lateral (
  select count(*)::int as count
  from public.listens ls
  where ls.server_id = s.id
) l on true;

grant select on public.servers_with_stats to authenticated, anon;

notify pgrst, 'reload schema';
