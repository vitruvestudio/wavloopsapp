-- Wavloops V3 — migration #34.
-- Security: stop submit_access_request() from returning the
-- producer's auth.users.id to anonymous callers.
--
-- Why
-- ───
-- submit_access_request is granted EXECUTE to `anon`, so anyone
-- can call it directly via the Supabase REST RPC endpoint with
-- the public anon key — not just through our gate form. Its JSON
-- return included `producer_user_id` (the producer's internal
-- auth.users UUID). That's an information leak: the id is the key
-- RLS keys notifications/likes/etc. off of, and exposing it to
-- the public lets an attacker enumerate + correlate producer
-- accounts. The Next.js gate action never actually reads the
-- field (it resolves the producer's notif target via the
-- separate get_server_owner_notif_target RPC), so dropping it
-- breaks nothing.
--
-- This recreates the function identically EXCEPT the return no
-- longer carries producer_user_id. The variable is still used
-- internally to insert the producer notification.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

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

  v_status := case when v_visibility = 'private' then 'pending' else 'granted' end;

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

  if v_inserted_member > 0 and v_status = 'pending' then
    select user_id into v_producer_user_id
    from public.profiles
    where id = v_owner_id;

    if v_producer_user_id is not null then
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

  -- producer_user_id intentionally omitted from the return — see
  -- migration header. Callers only need ok / visibility / was_new
  -- / server_name.
  return json_build_object(
    'ok', true,
    'visibility', v_visibility,
    'was_new', v_inserted_member > 0,
    'server_name', v_server_name
  );
end;
$$;

revoke all on function public.submit_access_request(text, text, text) from public;
grant execute on function public.submit_access_request(text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
