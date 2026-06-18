-- Wavloops V3 — migration #23.
-- Phase 3.9.4 — wire notifications for Realtime.
--
-- The producer's topbar bell (and the artist's, already shipped)
-- subscribes to postgres_changes on the notifications table. For
-- that subscription to actually deliver:
--
--   1. The table must be in the `supabase_realtime` publication.
--   2. REPLICA IDENTITY must be FULL so RLS can evaluate the
--      WHERE filter (`recipient_user_id=eq.<uid>`) — the default
--      identity (PK only) doesn't carry the recipient_user_id
--      column to the change event.
--
-- Both have been applied via ad-hoc SQL during earlier dev
-- sessions for some tables (likes, listens). Codifying it here
-- so a fresh project bootstrap doesn't silently miss the bell.
--
-- All statements are guarded — re-running is a no-op.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end$$;

alter table public.notifications replica identity full;
