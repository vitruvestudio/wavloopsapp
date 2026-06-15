-- Wavloops V3 — migration #4.
-- Extends the `beats` table with the five fields the Upload Beat
-- modal needs (description, co-producers, artist types, autotune key,
-- artwork url) and ships a `beats_with_stats` view that joins beats
-- to the three counts the Beat library list needs in one query:
-- `in_servers_count`, `plays_count`, `likes_count`.
--
-- HOW TO APPLY
-- ─────────────
-- Dashboard → SQL Editor → paste this file → Run.
-- Idempotent (`add column if not exists` + `create or replace view`).

-- ============================================================
-- beats — new columns
-- ============================================================
alter table public.beats
  add column if not exists description text,
  add column if not exists co_producers text[] not null default array[]::text[],
  add column if not exists artist_types text[] not null default array[]::text[],
  add column if not exists autotune_key text,
  add column if not exists artwork_url text;

-- ============================================================
-- beats_with_stats — the view the Beat library consumes
-- ============================================================
-- security_invoker = true → the view inherits the RLS of the underlying
-- tables. Producer reads only their own beats; the public read policy
-- on `beats` (via the public_select policy that joins through
-- server_beats + servers) still applies.
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
