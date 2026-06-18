-- Wavloops V3 — migration #31.
-- Extend `beats_with_stats` with comments_count so the producer
-- BeatRow can surface a 💬 N counter alongside plays + likes.
--
-- The shape is the standard lateral-count pattern already used
-- for plays / likes / in_servers; counting from beat_comments
-- (the artist's SHARED feedback table — private beat_notes
-- aren't surfaced as engagement since the producer never sees
-- those).
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

create or replace view public.beats_with_stats
with (security_invoker = true) as
select
  b.*,
  coalesce(s.count, 0)::int as in_servers_count,
  coalesce(l.count, 0)::int as plays_count,
  coalesce(k.count, 0)::int as likes_count,
  coalesce(c.count, 0)::int as comments_count
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
) c on true;

grant select on public.beats_with_stats to authenticated, anon;

notify pgrst, 'reload schema';
