-- Wavloops V3 — migration #16.
-- Fix the infinite-recursion crash introduced by migration #15.
--
-- What broke
-- ──────────
-- Migration #15 wired 4 SELECT policies that read each other's
-- tables. Together with the existing producer-side owner_all
-- policies, this formed a cycle on every authenticated SELECT
-- against `servers`:
--
--   1. servers_artist_read does EXISTS(... from server_contacts ...)
--   2. that triggers server_contacts RLS — including the producer's
--      server_contacts_owner_all, which does EXISTS(... from servers ...)
--   3. which triggers servers RLS — back to #1.
--
-- Postgres detected the cycle and bailed with 42P17, blocking every
-- read on servers / server_contacts / server_beats / beats —
-- including the producer's own owner_select path.
--
-- The fix
-- ───────
-- Move each artist-side access check into a SECURITY DEFINER
-- function. SECURITY DEFINER runs the function body as the owner
-- (postgres), bypassing RLS on the joined tables, so the policy's
-- subquery never re-enters the policy graph. The functions stay
-- safe because:
--   - They only return a boolean (no row leakage).
--   - Their bodies filter strictly on `auth.uid()` — there's no
--     input parameter that lets a caller probe other users.
--   - Execute is granted only to `authenticated`.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. Drop the recursive policies from migration #15.
-- ============================================================
drop policy if exists server_contacts_artist_read on public.server_contacts;
drop policy if exists servers_artist_read         on public.servers;
drop policy if exists server_beats_artist_read    on public.server_beats;
drop policy if exists beats_artist_read           on public.beats;

-- ============================================================
-- 2. SECURITY DEFINER helpers. Each returns true iff the
--    currently-authenticated user is an artist with access to
--    the given row via contacts.auth_user_id.
-- ============================================================

-- 2a. Server access via contacts → server_contacts.
create or replace function public.artist_can_read_server(p_server_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from server_contacts sc
    join contacts c on c.id = sc.contact_id
    where sc.server_id = p_server_id
      and c.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.artist_can_read_server(uuid) from public;
grant execute on function public.artist_can_read_server(uuid) to authenticated;

-- 2b. server_contacts row access — the row itself is mine if its
--     contact_id is mine. Doesn't need to traverse servers.
create or replace function public.artist_can_read_server_contact(p_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from contacts c
    where c.id = p_contact_id
      and c.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.artist_can_read_server_contact(uuid) from public;
grant execute on function public.artist_can_read_server_contact(uuid) to authenticated;

-- 2c. Beat access — true iff any server I have access to (via 2a)
--     carries this beat through server_beats.
create or replace function public.artist_can_read_beat(p_beat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from server_beats sb
    join server_contacts sc on sc.server_id = sb.server_id
    join contacts c on c.id = sc.contact_id
    where sb.beat_id = p_beat_id
      and c.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.artist_can_read_beat(uuid) from public;
grant execute on function public.artist_can_read_beat(uuid) to authenticated;

-- 2d. server_beats row — true iff I have access to the parent
--     server (2a).
create or replace function public.artist_can_read_server_beat(p_server_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.artist_can_read_server(p_server_id);
$$;

revoke all on function public.artist_can_read_server_beat(uuid) from public;
grant execute on function public.artist_can_read_server_beat(uuid) to authenticated;

-- ============================================================
-- 3. Re-create the four policies using the helpers. No more
--    cross-table reads happen inside RLS — the SECURITY DEFINER
--    bodies short-circuit the cycle.
-- ============================================================

create policy server_contacts_artist_read on public.server_contacts
  for select to authenticated
  using (public.artist_can_read_server_contact(server_contacts.contact_id));

create policy servers_artist_read on public.servers
  for select to authenticated
  using (public.artist_can_read_server(servers.id));

create policy server_beats_artist_read on public.server_beats
  for select to authenticated
  using (public.artist_can_read_server_beat(server_beats.server_id));

create policy beats_artist_read on public.beats
  for select to authenticated
  using (public.artist_can_read_beat(beats.id));

notify pgrst, 'reload schema';
