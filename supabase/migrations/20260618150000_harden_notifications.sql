-- Wavloops V3 — migration #26.
-- Phase 3.9.5+ hardening — make the notification system robust
-- against race conditions, unbounded growth, and silent skips.
--
-- Three layers of defense:
--
--   1. Partial UNIQUE INDEX on (recipient_user_id, beat_id,
--      actor_user_id) WHERE kind='like'. The notify_like trigger's
--      EXISTS check is application-level dedup — under high
--      concurrency two simultaneous likes could both pass it and
--      both INSERT. The DB-level UNIQUE makes that impossible:
--      Postgres will reject the second INSERT, and ON CONFLICT
--      DO NOTHING in the trigger swallows the error gracefully.
--
--   2. Retention via prune_old_notifications() — read rows older
--      than 30 days get DELETEd. Scheduled daily via pg_cron when
--      that extension is enabled on the project (best-effort —
--      a missing pg_cron just logs a NOTICE so the migration
--      doesn't fail on free-tier projects).
--
--   3. Trigger function recreated to use ON CONFLICT DO NOTHING
--      so duplicate-key errors never bubble out and crash the
--      parent INSERT on `likes`.
--
-- All statements are idempotent — re-running is safe.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. Race-safe UNIQUE INDEX on like-kind notifications
-- ============================================================
create unique index if not exists notifications_like_dedup_idx
  on public.notifications (recipient_user_id, beat_id, actor_user_id)
  where kind = 'like';

-- ============================================================
-- 2. notify_like — recreated with ON CONFLICT DO NOTHING
-- ============================================================
create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_beat_title text;
  v_producer_user_id uuid;
  v_artist_uid uuid;
  v_artist_label text;
begin
  -- Resolve beat owner → producer auth user.
  select b.title, p.user_id
    into v_beat_title, v_producer_user_id
  from public.beats b
  join public.profiles p on p.id = b.owner_id
  where b.id = new.beat_id;
  if v_producer_user_id is null then return new; end if;

  -- Resolve artist auth user via the contact row.
  select c.auth_user_id into v_artist_uid
  from public.contacts c
  where c.id = new.contact_id;
  if v_artist_uid is null then return new; end if;

  -- Display label.
  select ap.display_name into v_artist_label
  from public.artist_profiles ap
  where ap.user_id = v_artist_uid;
  if v_artist_label is null then
    select split_part(c.email, '@', 1) into v_artist_label
    from public.contacts c
    where c.id = new.contact_id;
  end if;
  v_artist_label := coalesce(v_artist_label, 'an artist');

  -- INSERT with ON CONFLICT — the partial UNIQUE index above
  -- does the heavy lifting; this clause just keeps the trigger
  -- from raising on duplicates and rolling back the parent
  -- like INSERT.
  -- Bare ON CONFLICT DO NOTHING covers ANY unique violation —
  -- including the partial UNIQUE INDEX from earlier in this
  -- migration. Avoids restating the index predicate inline and
  -- keeps the trigger forgiving against future index additions.
  insert into public.notifications
    (recipient_user_id, kind, actor_name, actor_seed,
     actor_user_id, body, beat_id, server_id)
  values (
    v_producer_user_id,
    'like',
    v_artist_label,
    v_artist_label,
    v_artist_uid,
    format('liked %s.', v_beat_title),
    new.beat_id,
    new.server_id
  )
  on conflict do nothing;
  return new;
end;
$$;

-- ============================================================
-- 3. Retention — purge read rows older than 30 days
-- ============================================================
create or replace function public.prune_old_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.notifications
  where read = true
    and created_at < now() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.prune_old_notifications from public;

comment on function public.prune_old_notifications is
  'Phase 3.9.5+: deletes read notifications older than 30 days. Scheduled daily via pg_cron when enabled; safe to call ad-hoc.';

-- ============================================================
-- 4. Daily schedule via pg_cron (best-effort)
-- ============================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Unschedule any prior version, then re-schedule (idempotent).
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'wavloops_prune_notifications';

    perform cron.schedule(
      'wavloops_prune_notifications',
      '0 3 * * *',  -- 03:00 UTC daily
      $cron$ select public.prune_old_notifications() $cron$
    );
    raise notice 'wavloops_prune_notifications scheduled.';
  else
    raise notice 'pg_cron not enabled — daily cleanup not scheduled. Enable via Dashboard → Database → Extensions, then re-run this migration.';
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end$$;
