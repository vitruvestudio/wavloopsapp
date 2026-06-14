-- Wavloops V3 — migration #3.
-- View `servers_with_stats` — exposes every column of `servers` plus the
-- three counts the Dashboard needs: beats_count, contacts_count,
-- plays_count.
--
-- Why a view, not denormalised columns + triggers?
--   At Wavloops' V1 scale (<<100 servers/user) the lateral joins are
--   trivial — we'd rather pay the COUNT cost on read than maintain
--   triggers on three write-paths (server_beats / contacts / listens).
--   When per-server traffic grows past the point where the view is
--   noticeably slow we'll convert these to denormalised columns with
--   incremental triggers; the application-facing schema (this view)
--   won't change.
--
-- security_invoker = true → the view inherits the RLS of the underlying
-- tables instead of running as the view's owner. Producer SELECTs only
-- their own servers; the public SELECT policy on servers + the per-
-- table policies on server_beats / contacts / listens automatically
-- gate the aggregates.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.
-- Idempotent (`create or replace view`).

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
  from public.contacts ct
  where ct.server_id = s.id
) c on true
left join lateral (
  select count(*)::int as count
  from public.listens ls
  where ls.server_id = s.id
) l on true;

-- Allow the API roles to query the view. Underlying-table RLS still
-- applies thanks to security_invoker.
grant select on public.servers_with_stats to authenticated, anon;
