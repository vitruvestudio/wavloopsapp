-- ============================================================
-- Migration #33 — Harden listens + likes public policies
-- ============================================================
--
-- Follow-up to migration #32 (cross-producer SELECT leak fix).
-- The full RLS audit surfaced two integrity holes on listens
-- and likes:
--
-- 1. likes_public_delete was `for delete to public` and only
--    checked that the server was public — never that the row
--    being deleted belonged to the caller. Any authenticated
--    user could erase any like on any public server, sabotaging
--    another artist's engagement record.
--
-- 2. listens_public_insert and likes_public_insert were
--    `for insert to public` with a check that just validated
--    `server.visibility = 'public'`. They didn't validate that
--    the `contact_id` being written matched the calling user's
--    own contact row. An authenticated user could insert
--    listens/likes attributing them to any contact on any
--    public server — gaming play counts and like counts.
--
-- Fix: narrow each policy to `to anon` so authenticated users
-- must go through the `_artist_*` policies which validate
-- contact_id ownership via artist_owns_contact_server(). For
-- likes_public_delete, drop entirely — anonymous gate
-- visitors don't have a stable identity to delete from, and
-- authenticated artists already have likes_artist_delete.
--
-- This migration is idempotent (drop/create) and re-runnable.
-- ============================================================

-- ── listens ──────────────────────────────────────────────────
-- Anonymous visitors of a public gate page can still log a
-- play. Authenticated artists must pass through
-- listens_artist_insert which validates the contact_id.
drop policy if exists listens_public_insert on public.listens;
create policy listens_public_insert on public.listens
  for insert to anon
  with check (
    exists (
      select 1 from public.servers s
      where s.id = listens.server_id
        and s.visibility = 'public'
    )
  );

-- ── likes ────────────────────────────────────────────────────
-- Same shape as listens: anon-only insert, auth goes through
-- likes_artist_insert.
drop policy if exists likes_public_insert on public.likes;
create policy likes_public_insert on public.likes
  for insert to anon
  with check (
    exists (
      select 1 from public.servers s
      where s.id = likes.server_id
        and s.visibility = 'public'
    )
  );

-- Drop the public-delete entirely. Anonymous visitors have no
-- stable identity to delete by (anon sessions don't survive a
-- tab close), and authenticated artists already cover their
-- own un-like flow via likes_artist_delete which validates
-- artist_owns_contact_server().
drop policy if exists likes_public_delete on public.likes;

notify pgrst, 'reload schema';
