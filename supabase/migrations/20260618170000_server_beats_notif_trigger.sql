-- Wavloops V3 — migration #28.
-- Phase 3.9.6.2 — DB-level trigger for upload notifications.
--
-- Why a trigger instead of the JS fan-out shipped earlier:
-- server_beats gets INSERTed from at least two app paths
--   1. addBeatsToServerAction (AddBeatsModal on /servers/[slug])
--   2. uploadBeat action (Upload a beat page with "Add to servers"
--      checkboxes)
-- Putting the side-effect at the DB layer means BOTH paths (and
-- any future one) automatically produce notifications without
-- having to remember to call a helper. Same altitude as the like
-- and comment triggers from migration #24.
--
-- Each new server_beats row → one notification per granted
-- contact on that server with a resolved auth_user_id. Contacts
-- without auth_user_id (producer added by email only, artist
-- hasn't signed in) get nothing here — they'll receive the
-- "added_to_server" email when bind_artist_contacts runs after
-- their first sign-in (or the added_to_server email already
-- shipped in 3.9.6.1).
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

  -- One INSERT per granted artist with a resolved auth_user_id.
  -- The cron at /api/cron/batch-upload-emails picks these up,
  -- groups by (recipient_user_id, server_id), waits 10 min from
  -- the oldest row, and ships one digest email per group.
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
  where sc.server_id = new.server_id
    and sc.status = 'granted'
    and c.auth_user_id is not null;

  return new;
end;
$$;

drop trigger if exists server_beats_notify on public.server_beats;
create trigger server_beats_notify
  after insert on public.server_beats
  for each row execute function public.notify_server_beat_added();

notify pgrst, 'reload schema';
