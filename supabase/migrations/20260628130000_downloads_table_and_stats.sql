-- ============================================================
-- Wavloops — download tracking
--
-- 1. New `downloads` table — one row per successful artist
--    download. Same shape as `listens` (contact/beat/server +
--    timestamp) so future analytics (per-artist downloads, per-
--    server downloads, time series) reuse the existing patterns.
--
--    Producer-side downloads (the owner downloading their own
--    beat) are NOT inserted into this table — see the comment
--    in app/api/beats/[id]/download/route.ts. The producer is
--    not an "engagement" event, and counting it would inflate
--    every counter the second the producer tests their own
--    server.
--
-- 2. Extend `beats_with_stats` with `downloads_count`. Same
--    lateral-count pattern as plays_count / likes_count /
--    comments_count. We must DROP-then-CREATE the view because
--    `s.*` re-expanded later positions downloads_count between
--    the beats columns and the existing stats columns —
--    `create or replace view` rejects that as a column rename.
-- ============================================================

-- ─── 1. Table ──────────────────────────────────────────────
create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null
    references public.contacts (id) on delete cascade,
  beat_id uuid not null
    references public.beats (id) on delete cascade,
  server_id uuid not null
    references public.servers (id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index if not exists downloads_beat_idx
  on public.downloads (beat_id);
create index if not exists downloads_server_downloaded_idx
  on public.downloads (server_id, downloaded_at desc);

alter table public.downloads enable row level security;

-- Producers can read their own beats' downloads (for the
-- stats view + future per-beat analytics page). The insert
-- path is service-role only — the API route uses the admin
-- client because the artist's RLS read scope on beats is
-- intentionally narrow, and writing through the user-scoped
-- client would tie inserts to whichever surface the artist
-- happens to hit.
drop policy if exists downloads_owner_select on public.downloads;
create policy downloads_owner_select on public.downloads
  for select to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = downloads.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- ─── 2. beats_with_stats view ──────────────────────────────
drop view if exists public.beats_with_stats;

create view public.beats_with_stats
with (security_invoker = true) as
select
  b.*,
  coalesce(s.count, 0)::int as in_servers_count,
  coalesce(l.count, 0)::int as plays_count,
  coalesce(k.count, 0)::int as likes_count,
  coalesce(c.count, 0)::int as comments_count,
  coalesce(d.count, 0)::int as downloads_count
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
) k on true
left join lateral (
  select count(*)::int as count
  from public.beat_comments bc
  where bc.beat_id = b.id
) c on true
left join lateral (
  select count(*)::int as count
  from public.downloads dl
  where dl.beat_id = b.id
) d on true;

grant select on public.beats_with_stats to authenticated, anon;

notify pgrst, 'reload schema';
