-- ============================================================
-- servers.force_artwork_on_beats
--
-- Display-only override: when ON for a server with an uploaded
-- artwork_image_url, every beat rendered INSIDE that server's
-- artist surface (and producer preview) borrows the server
-- artwork instead of its own beats.artwork_url.
--
-- Scoped to the server — beats keep their original artwork_url
-- in the library and in any other server they belong to. The
-- swap happens at the loader / adapter layer, never in the DB.
-- The flag exists only so the producer's choice persists across
-- sessions.
--
-- Defaults to false so existing rows stay visually unchanged.
--
-- Like the downloads_allowed addition (migration 20260622090000)
-- the servers_with_stats view's `s.*` was frozen at create-time
-- and won't pick up the new column unless we drop + recreate it.
-- Same `create or replace` reorder check we hit before — go
-- straight to DROP + CREATE.
-- ============================================================

alter table public.servers
  add column if not exists force_artwork_on_beats boolean
  not null default false;

comment on column public.servers.force_artwork_on_beats is
  'When true and artwork_image_url is set, beats rendered inside this server inherit the server artwork. Display-only override; beats.artwork_url is never mutated.';

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

notify pgrst, 'reload schema';
