-- Wavloops V3 — migration #24.
-- Phase 3.9.5 — producer-side notification triggers for likes
-- and shared comments.
--
-- 1. Extends notifications.kind with 'like' and 'comment'.
-- 2. Adds notifications.actor_user_id so we can dedupe by the
--    underlying auth.users id, not the (mutable) display_name.
-- 3. Trigger `notify_like` fires AFTER INSERT ON likes: looks up
--    the beat's producer, the artist's display_name (via
--    contacts → auth_user_id → artist_profiles), and inserts a
--    notification row UNLESS one already exists for this
--    (recipient, kind, beat_id, actor_user_id) — that way a
--    re-like after an unlike doesn't double-ping.
-- 4. Trigger `notify_comment` fires AFTER INSERT ON beat_comments:
--    same lookup pattern, no dedup (each shared comment is a
--    distinct event the producer should see).
--
-- Postgres triggers are the right altitude here — the source of
-- truth IS the like/comment row, and putting the side-effect at
-- the DB layer means the bell stays consistent regardless of
-- which surface (app action / direct SQL / future API) creates
-- the row.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. notifications.actor_user_id — stable dedup key
-- ============================================================
alter table public.notifications
  add column if not exists actor_user_id uuid
  references auth.users (id) on delete set null;

-- ============================================================
-- 2. Extend kind enum
-- ============================================================
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in (
    'upload',
    'added_to_server',
    'drop',
    'comment_like',
    'trending',
    'access_request',
    'like',
    'comment'
  ));

-- ============================================================
-- 3. notify_like — AFTER INSERT ON likes
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

  -- Dedup: a re-like after an unlike shouldn't surface a 2nd notif
  -- for the same (recipient, beat, artist) triple.
  if exists (
    select 1
    from public.notifications
    where recipient_user_id = v_producer_user_id
      and kind = 'like'
      and beat_id = new.beat_id
      and actor_user_id = v_artist_uid
  ) then
    return new;
  end if;

  -- Display label: artist_profiles.display_name first, fallback to
  -- contact email local-part so the row never reads as "null liked".
  select ap.display_name into v_artist_label
  from public.artist_profiles ap
  where ap.user_id = v_artist_uid;
  if v_artist_label is null then
    select split_part(c.email, '@', 1) into v_artist_label
    from public.contacts c
    where c.id = new.contact_id;
  end if;
  v_artist_label := coalesce(v_artist_label, 'an artist');

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
  );
  return new;
end;
$$;

drop trigger if exists likes_notify on public.likes;
create trigger likes_notify
  after insert on public.likes
  for each row execute function public.notify_like();

-- ============================================================
-- 4. notify_comment — AFTER INSERT ON beat_comments
-- ============================================================
create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_beat_title text;
  v_producer_user_id uuid;
  v_artist_label text;
begin
  select b.title, p.user_id
    into v_beat_title, v_producer_user_id
  from public.beats b
  join public.profiles p on p.id = b.owner_id
  where b.id = new.beat_id;

  if v_producer_user_id is null then return new; end if;

  -- new.user_id is the artist's auth.users.id directly (no contact
  -- pivot for beat_comments — the table records user_id outright).
  select ap.display_name into v_artist_label
  from public.artist_profiles ap
  where ap.user_id = new.user_id;
  if v_artist_label is null then
    select email into v_artist_label
    from auth.users where id = new.user_id;
    if v_artist_label is not null then
      v_artist_label := split_part(v_artist_label, '@', 1);
    end if;
  end if;
  v_artist_label := coalesce(v_artist_label, 'an artist');

  insert into public.notifications
    (recipient_user_id, kind, actor_name, actor_seed,
     actor_user_id, body, beat_id)
  values (
    v_producer_user_id,
    'comment',
    v_artist_label,
    v_artist_label,
    new.user_id,
    format('left feedback on %s.', v_beat_title),
    new.beat_id
  );
  return new;
end;
$$;

drop trigger if exists comments_notify on public.beat_comments;
create trigger comments_notify
  after insert on public.beat_comments
  for each row execute function public.notify_comment();

notify pgrst, 'reload schema';
