-- Wavloops V3 — migration #15.
-- RLS policies that let an authed artist READ the producer-owned
-- rows they've been assigned to (server_contacts → servers →
-- server_beats → beats).
--
-- Why this lands now
-- ──────────────────
-- Theo signed in as artist, the sidebar correctly listed the
-- producer who'd added him as a contact, but "0 servers" sat under
-- the producer card even though the server_contacts row existed.
--
-- Cause: every chain of tables involved in the listen-side join had
-- only TWO read paths defined —
--   1. owner_all (producer reading their own rows)
--   2. *_public_select (anonymous reading PUBLIC-visibility rows)
-- — and no policy covered "I'm an authed artist whose contact_id
-- maps to me via auth_user_id".
--
-- This migration adds the missing artist-read on all four tables.
-- Private servers + their beats / pivots now work, because the
-- artist read path doesn't go through visibility = public.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. server_contacts — artist can read rows where they ARE the
--    contact (mapped through contacts.auth_user_id). This is what
--    the embedded `server_contacts(server:servers(...))` join in
--    loadArtistContext needs to return non-empty.
-- ============================================================
drop policy if exists server_contacts_artist_read on public.server_contacts;
create policy server_contacts_artist_read on public.server_contacts
  for select to authenticated
  using (
    exists (
      select 1
      from public.contacts c
      where c.id = server_contacts.contact_id
        and c.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. servers — artist can read any server they're a contact of,
--    REGARDLESS of visibility. Covers private servers, which the
--    existing servers_public_select can't see.
-- ============================================================
drop policy if exists servers_artist_read on public.servers;
create policy servers_artist_read on public.servers
  for select to authenticated
  using (
    exists (
      select 1
      from public.server_contacts sc
      join public.contacts c on c.id = sc.contact_id
      where sc.server_id = servers.id
        and c.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. server_beats — artist can read the pivot rows for any server
--    they're a contact of. Same coverage as #2 but on the
--    server→beats junction.
-- ============================================================
drop policy if exists server_beats_artist_read on public.server_beats;
create policy server_beats_artist_read on public.server_beats
  for select to authenticated
  using (
    exists (
      select 1
      from public.server_contacts sc
      join public.contacts c on c.id = sc.contact_id
      where sc.server_id = server_beats.server_id
        and c.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. beats — artist can read any beat that appears in a
--    server_beats row they have access to via #3. Independent of
--    server visibility — the access right comes from being on
--    server_contacts, not from the server being public.
-- ============================================================
drop policy if exists beats_artist_read on public.beats;
create policy beats_artist_read on public.beats
  for select to authenticated
  using (
    exists (
      select 1
      from public.server_beats sb
      join public.server_contacts sc on sc.server_id = sb.server_id
      join public.contacts c on c.id = sc.contact_id
      where sb.beat_id = beats.id
        and c.auth_user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
