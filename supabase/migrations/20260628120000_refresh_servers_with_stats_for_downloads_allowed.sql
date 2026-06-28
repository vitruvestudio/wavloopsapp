-- ============================================================
-- Refresh the servers_with_stats view so it picks up the
-- `downloads_allowed` column.
--
-- Bug we hit:
--   - 20260615150000_refactor_contacts_top_level.sql created
--     `servers_with_stats` with `select s.*` from servers.
--   - 20260622090000_servers_downloads_allowed.sql later added
--     `downloads_allowed boolean` to public.servers.
--   - Postgres expands `select *` in a view at the moment the
--     view is defined, not at query time. The view's column
--     list was frozen BEFORE downloads_allowed existed, so the
--     column is invisible through the view even though it's
--     real on the table.
--
-- Net effect for the producer:
--   /servers/[slug]/edit reads from servers_with_stats, gets
--   `downloads_allowed = undefined`, and the toggle defaults to
--   off after every save — looked like the save was broken.
--
-- Fix: drop and recreate the view so `s.*` is re-parsed.
-- Note: `create or replace view` refused this — Postgres rejects
-- column reordering through replace (the newly-expanded
-- downloads_allowed lands between the frozen servers columns and
-- the stats columns, which shifts beats_count's position and
-- trips the "cannot change name of view column" check).
-- Dropping first sidesteps the check; nothing has a foreign key
-- to a view, so DROP is safe.
-- ============================================================
drop view if exists public.servers_with_stats;

create view public.servers_with_stats
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

-- Ping PostgREST so the schema cache reloads — otherwise the
-- new column is invisible to supabase-js until the next pod
-- restart.
notify pgrst, 'reload schema';
