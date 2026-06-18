-- Wavloops V3 — migration #29.
-- Phase 3.9.7.1 — artist-side notif_prefs respect.
--
-- The notify_server_beat_added trigger now joins artist_profiles
-- and skips contacts whose notif_prefs.new_beats = false. When a
-- contact has no artist_profiles row yet (haven't visited the
-- Settings page), default to true — the toggles' UI default is
-- "on", so honoring that for unset preferences matches what the
-- artist would see if they opened the page.
--
-- Email respect (notif_prefs.email) is enforced at the cron
-- layer, not the trigger — the in-app notif row should still land
-- when email is off but new_beats is on (the artist disabled
-- email but still wants the cloche to ring).
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

create or replace function public.notify_server_beat_added()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_beat_title text;
  v_server_name text;
  v_owner_id uuid;
  v_producer_user_id uuid;
  v_producer_handle text;
begin
  -- Beat + server identity.
  select b.title into v_beat_title
  from public.beats b
  where b.id = new.beat_id;
  if v_beat_title is null then return new; end if;

  select s.name, s.owner_id
    into v_server_name, v_owner_id
  from public.servers s
  where s.id = new.server_id;
  if v_server_name is null then return new; end if;

  -- Producer handle for the notif body.
  select p.user_id, coalesce(p.handle, p.name, 'producer')
    into v_producer_user_id, v_producer_handle
  from public.profiles p
  where p.id = v_owner_id;
  v_producer_handle := coalesce(v_producer_handle, 'producer');
  if position('@' in v_producer_handle) <> 1 then
    v_producer_handle := '@' || v_producer_handle;
  end if;

  -- Phase 3.9.7.1: LEFT JOIN artist_profiles + filter on
  -- notif_prefs.new_beats. Coalesce to true when:
  --   - artist_profiles row doesn't exist yet
  --   - notif_prefs.new_beats key isn't set
  -- so the default-on Settings toggle is honored for new artists.
  insert into public.notifications
    (recipient_user_id, kind, actor_name, actor_seed,
     actor_user_id, body, server_id, beat_id)
  select
    c.auth_user_id,
    'upload',
    v_producer_handle,
    v_producer_handle,
    v_producer_user_id,
    format('uploaded %s to %s.', v_beat_title, v_server_name),
    new.server_id,
    new.beat_id
  from public.contacts c
  join public.server_contacts sc on sc.contact_id = c.id
  left join public.artist_profiles ap on ap.user_id = c.auth_user_id
  where sc.server_id = new.server_id
    and sc.status = 'granted'
    and c.auth_user_id is not null
    and coalesce((ap.notif_prefs->>'new_beats')::boolean, true) = true;

  return new;
end;
$$;

notify pgrst, 'reload schema';
