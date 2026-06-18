-- Wavloops V3 — migration #30.
-- Phase 3.9.7.2 — producer-side notif_prefs respect.
--
-- 1. Adds profiles.notif_prefs JSONB column with sensible
--    defaults so existing producers don't need to visit the
--    Settings page to start receiving notifications.
-- 2. Updates notify_like trigger: skip if producer
--    notif_prefs.likes = false.
-- 3. Updates notify_comment trigger: skip if producer
--    notif_prefs.comments = false.
-- 4. Updates submit_access_request RPC: skip the in-app notif
--    INSERT if producer notif_prefs.access_request = false.
--
-- Producer-side EMAIL toggle (notif_prefs.email) is enforced at
-- the JS action layer, not in the triggers — same pattern as
-- the artist side. The pending row still gets created so the
-- access flow stays consistent; only the email channel is gated.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. profiles.notif_prefs
-- ============================================================
alter table public.profiles
  add column if not exists notif_prefs jsonb not null default '{
    "access_request": true,
    "likes": true,
    "comments": true,
    "email": true,
    "push": false
  }'::jsonb;

-- ============================================================
-- 2. notify_like — respect producer notif_prefs.likes
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
  v_producer_wants boolean;
begin
  -- Resolve beat owner → producer auth user.
  select b.title, p.user_id
    into v_beat_title, v_producer_user_id
  from public.beats b
  join public.profiles p on p.id = b.owner_id
  where b.id = new.beat_id;
  if v_producer_user_id is null then return new; end if;

  -- Respect producer notif_prefs.likes.
  select coalesce((p.notif_prefs->>'likes')::boolean, true)
    into v_producer_wants
  from public.profiles p
  where p.user_id = v_producer_user_id;
  if not coalesce(v_producer_wants, true) then return new; end if;

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
-- 3. notify_comment — respect producer notif_prefs.comments
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
  v_producer_wants boolean;
begin
  select b.title, p.user_id
    into v_beat_title, v_producer_user_id
  from public.beats b
  join public.profiles p on p.id = b.owner_id
  where b.id = new.beat_id;
  if v_producer_user_id is null then return new; end if;

  -- Respect producer notif_prefs.comments.
  select coalesce((p.notif_prefs->>'comments')::boolean, true)
    into v_producer_wants
  from public.profiles p
  where p.user_id = v_producer_user_id;
  if not coalesce(v_producer_wants, true) then return new; end if;

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

-- ============================================================
-- 4. submit_access_request — respect producer notif_prefs.access_request
-- ============================================================
create or replace function public.submit_access_request(
  p_slug text,
  p_email text,
  p_social text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_normalized_email text := lower(trim(coalesce(p_email, '')));
  v_server_id uuid;
  v_owner_id uuid;
  v_visibility text;
  v_server_name text;
  v_producer_user_id uuid;
  v_contact_id uuid;
  v_status text;
  v_inserted_member integer;
  v_socials_patch jsonb;
  v_actor_label text;
  v_producer_wants boolean;
begin
  if v_normalized_email = '' or
     v_normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return json_build_object('ok', false, 'error', 'Invalid email');
  end if;

  select id, owner_id, visibility, name
    into v_server_id, v_owner_id, v_visibility, v_server_name
  from public.servers
  where slug = p_slug
  limit 1;

  if v_server_id is null then
    return json_build_object('ok', false, 'error', 'Server not found');
  end if;

  v_status := case
    when v_visibility = 'private' then 'pending'
    else 'granted'
  end;

  v_socials_patch := case
    when p_social is not null and length(trim(p_social)) > 0
    then jsonb_build_object('social', trim(p_social))
    else '{}'::jsonb
  end;

  insert into public.contacts
    (owner_id, email, auth_user_id, last_active_at, socials)
  values
    (v_owner_id, v_normalized_email, v_uid, now(), v_socials_patch)
  on conflict (owner_id, email) do update set
    auth_user_id = coalesce(
      public.contacts.auth_user_id,
      excluded.auth_user_id
    ),
    last_active_at = now(),
    socials = public.contacts.socials || excluded.socials
  returning id into v_contact_id;

  insert into public.server_contacts
    (server_id, contact_id, status, granted_at, requested_at)
  values (
    v_server_id,
    v_contact_id,
    v_status,
    case when v_status = 'granted' then now() else null end,
    now()
  )
  on conflict (server_id, contact_id) do nothing;

  get diagnostics v_inserted_member = row_count;

  -- Producer in-app notif — only on freshly-pending rows AND
  -- only when producer hasn't opted out via notif_prefs.access_request.
  if v_inserted_member > 0 and v_status = 'pending' then
    select user_id into v_producer_user_id
    from public.profiles
    where id = v_owner_id;

    if v_producer_user_id is not null then
      select coalesce((p.notif_prefs->>'access_request')::boolean, true)
        into v_producer_wants
      from public.profiles p
      where p.user_id = v_producer_user_id;

      if coalesce(v_producer_wants, true) then
        v_actor_label := split_part(v_normalized_email, '@', 1);
        insert into public.notifications
          (recipient_user_id, kind, actor_name, actor_seed, body, server_id)
        values (
          v_producer_user_id,
          'access_request',
          v_actor_label,
          v_actor_label,
          format('wants access to %s.', v_server_name),
          v_server_id
        );
      end if;
    end if;
  end if;

  return json_build_object(
    'ok', true,
    'visibility', v_visibility,
    'was_new', v_inserted_member > 0,
    'producer_user_id', v_producer_user_id,
    'server_name', v_server_name
  );
end;
$$;

revoke all on function public.submit_access_request(text, text, text) from public;
grant execute on function public.submit_access_request(text, text, text)
  to anon, authenticated;

-- ============================================================
-- 5. get_server_owner_notif_target — bundle email + prefs in
--    one round-trip so the gate action / auth callback can gate
--    sendAccessRequestEmail by producer prefs.
-- ============================================================
create or replace function public.get_server_owner_notif_target(p_slug text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
  v_prefs jsonb;
begin
  select p.user_id, p.notif_prefs
    into v_user_id, v_prefs
  from public.servers s
  join public.profiles p on p.id = s.owner_id
  where s.slug = p_slug
  limit 1;
  if v_user_id is null then return null; end if;

  select email into v_email from auth.users where id = v_user_id;

  return json_build_object(
    'email', v_email,
    'wants_email', coalesce((v_prefs->>'email')::boolean, true),
    'wants_access_request',
      coalesce((v_prefs->>'access_request')::boolean, true)
  );
end;
$$;

revoke all on function public.get_server_owner_notif_target(text) from public;
grant execute on function public.get_server_owner_notif_target(text)
  to anon, authenticated;

notify pgrst, 'reload schema';
