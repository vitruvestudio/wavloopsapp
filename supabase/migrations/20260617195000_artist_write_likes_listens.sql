-- Wavloops V3 — migration #18.
-- Let an authed artist INSERT into likes / listens (and DELETE
-- their own like) for any server they're a contact on, not just
-- public-visibility servers.
--
-- Why this lands now
-- ──────────────────
-- The existing likes_public_insert / listens_public_insert /
-- likes_public_delete policies are scoped to `visibility = 'public'`,
-- which was the J6 anon-gate flow. Phase 3 introduces authenticated
-- artists writing to PRIVATE servers (Theo's "Test" is private), so
-- the legacy policies deny every write — the artist's heart click
-- looks like it worked optimistically but never lands a row, the
-- producer's engagement column stays at 0/0.
--
-- New scope: an authed user can write iff they're the contact the
-- row claims (likes.contact_id maps to a contacts row with
-- auth_user_id = auth.uid()) AND that contact has a server_contacts
-- assignment on the row's server_id.
--
-- Same SECURITY DEFINER pattern as migrations #16 / #17 — the
-- check function bypasses RLS on its subqueries so we don't form a
-- cycle through server_contacts → servers.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. Helper: is (contact_id, server_id) the current user's
--    assignment? Used by every policy below.
-- ============================================================
create or replace function public.artist_owns_contact_server(
  p_contact_id uuid,
  p_server_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from contacts c
    join server_contacts sc on sc.contact_id = c.id
    where c.id = p_contact_id
      and c.auth_user_id = auth.uid()
      and sc.server_id = p_server_id
  );
$$;

revoke all on function public.artist_owns_contact_server(uuid, uuid)
  from public;
grant execute on function public.artist_owns_contact_server(uuid, uuid)
  to authenticated;

-- ============================================================
-- 2. likes — INSERT + DELETE for the current artist.
-- ============================================================
drop policy if exists likes_artist_insert on public.likes;
create policy likes_artist_insert on public.likes
  for insert to authenticated
  with check (
    public.artist_owns_contact_server(likes.contact_id, likes.server_id)
  );

drop policy if exists likes_artist_delete on public.likes;
create policy likes_artist_delete on public.likes
  for delete to authenticated
  using (
    public.artist_owns_contact_server(likes.contact_id, likes.server_id)
  );

-- ============================================================
-- 3. listens — INSERT only. No DELETE policy because listens are
--    an append-only history: the producer-side engagement counter
--    needs every play, the artist UI only cares about "did at
--    least one row exist", and the eye-toggle in the UI is a
--    visual filter, not a row wipe.
-- ============================================================
drop policy if exists listens_artist_insert on public.listens;
create policy listens_artist_insert on public.listens
  for insert to authenticated
  with check (
    public.artist_owns_contact_server(listens.contact_id, listens.server_id)
  );

notify pgrst, 'reload schema';
