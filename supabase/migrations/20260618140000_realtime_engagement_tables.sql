-- Wavloops V3 — migration #25.
-- Phase 3.9.5 — codify Realtime wiring for engagement tables.
--
-- The producer's ServerDetailPage subscribes to postgres_changes
-- on likes + listens (filtered by server_id) to refresh the stat
-- cards + beat row counters live as artists engage. The
-- ProducerNotificationsMenu also relies on beat_comments INSERT
-- propagating (via the notify_comment trigger → notifications
-- INSERT — that's covered by migration #23's notifications
-- publication entry, but the trigger fires off beat_comments
-- whose own Realtime delivery is needed if any future surface
-- subscribes to the comment row directly).
--
-- All three tables were added to the supabase_realtime publication
-- via ad-hoc SQL during earlier dev sessions on Theo's project.
-- This migration codifies it so a fresh project bootstrap doesn't
-- silently miss the wiring.
--
-- Idempotent — re-running is a no-op.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['likes', 'listens', 'beat_comments']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end$$;

alter table public.likes replica identity full;
alter table public.listens replica identity full;
alter table public.beat_comments replica identity full;
