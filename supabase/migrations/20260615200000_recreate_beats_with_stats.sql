-- Wavloops V3 — migration #12.
-- Recreate the `beats_with_stats` view.
--
-- Why this needs to exist as a new migration
-- ──────────────────────────────────────────
-- Migration #7 (refactor_contacts_top_level) did
--   drop table if exists public.listens cascade;
--   drop table if exists public.likes   cascade;
-- to rebuild those tables under the new contacts model. The CASCADE
-- silently dropped `beats_with_stats` with them because the view's
-- lateral joins reference the listens / likes columns. Migration #7
-- recreated listens / likes but never the view, so PostgREST has
-- been returning PGRST205 on every /library load ever since —
-- beats were saving fine in the underlying table, just invisible
-- to the app.
--
-- This migration restores the view, identical body to migration #4
-- (recreating it from there + the listens/likes shape after #7,
-- which is unchanged). It's safe to apply more than once
-- (`create or replace view`).
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

create or replace view public.beats_with_stats
with (security_invoker = true) as
select
  b.*,
  coalesce(s.count, 0)::int as in_servers_count,
  coalesce(l.count, 0)::int as plays_count,
  coalesce(k.count, 0)::int as likes_count
from public.beats b
left join lateral (
  select count(*)::int as count
  from public.server_beats sb
  where sb.beat_id = b.id
) s on true
left join lateral (
  select count(*)::int as count
  from public.listens ls
  where ls.beat_id = b.id
) l on true
left join lateral (
  select count(*)::int as count
  from public.likes lk
  where lk.beat_id = b.id
) k on true;

grant select on public.beats_with_stats to authenticated, anon;

notify pgrst, 'reload schema';
