-- Wavloops V3 — migration #27.
-- Phase 3.9.6.2 — upload notif + digest email batching.
--
-- Adds emailed_at to notifications so the upload-digest cron can
-- mark which rows have already been included in a digest. A row
-- is "pending" if kind='upload' AND emailed_at IS NULL.
--
-- The batch policy: every minute the cron route handler picks up
-- (recipient_user_id, server_id) groups whose OLDEST pending row
-- is >= 10 min old, builds one digest email per group, sends it,
-- then stamps emailed_at = now() on every row in the group. So
-- multiple uploads within 10 min coalesce into one email; uploads
-- further apart get one email each.
--
-- Idempotent — re-running is safe.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

alter table public.notifications
  add column if not exists emailed_at timestamptz;

-- Partial index — speeds the cron's "give me the next batch" query.
-- Bounded to upload kind + null emailed_at so the index stays
-- small as the table grows.
create index if not exists notifications_upload_pending_idx
  on public.notifications (recipient_user_id, server_id, created_at)
  where kind = 'upload' and emailed_at is null;
