-- Wavloops V3 — migration #22.
-- Phase 3.9.3 — anon-callable access-request creation.
--
-- submit_access_request(p_slug, p_email, p_social) creates the
-- pending row + producer notification IMMEDIATELY on form submit,
-- without requiring the artist to first click the magic-link.
--
-- Why
-- ───
-- The previous flow (claim_server_access, fired from /auth/callback)
-- meant the producer didn't see a request until the artist verified
-- their email. If the artist never clicked the link, the producer
-- got zero signal — bad funnel UX. Theo's correct call: producer
-- sees the request at form-submit time; magic-link reverts to its
-- proper role of "verify the email you typed".
--
-- Security
-- ────────
-- SECURITY DEFINER + grant EXECUTE to anon — anyone hitting /s/<slug>
-- can fire this without being signed in. To bound the abuse surface:
--   - p_email is validated against a basic regex
--   - p_slug must resolve to a server that exists
--   - server_contacts UNIQUE(server_id, contact_id) makes the
--     write idempotent for the same (email, server) pair
--   - notification only inserts when a new pending row is actually
--     created — repeat submits don't spam the bell
-- Rate-limit / captcha for the gate form itself ship later if abuse
-- materialises; the current built-in Supabase auth rate-limit covers
-- the magic-link layer.
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
  -- Basic email validation. We rely on Supabase Auth's stricter
  -- check downstream for the magic-link send, but keep a guard
  -- here so the RPC never persists a clearly-bad address.
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

  -- Capture the (free-form) social handle the artist typed on the
  -- gate form. We default the platform key to 'social' since the
  -- single-field input doesn't tell us which network. Producer can
  -- re-categorise on the Contacts page later.
  v_socials_patch := case
    when p_social is not null and length(trim(p_social)) > 0
    then jsonb_build_object('social', trim(p_social))
    else '{}'::jsonb
  end;

  -- Upsert contact. v_uid is null when the caller is anon (the
  -- standard gate-submit case); bind_artist_contacts fills it later
  -- when the artist clicks the magic-link. When v_uid is set (the
  -- already-authed shortcut), record it now.
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

  -- Producer notification ONLY on a freshly-inserted pending row.
  -- Repeat submits / re-clicks land as no-ops; previously-granted
  -- rows don't re-trigger.
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

comment on function public.submit_access_request is
  'Phase 3.9.3: anon-callable. Creates the pending server_contacts row + producer notification at gate-form submit time, before the artist verifies their email via magic-link. Returns { ok, visibility, was_new, producer_user_id, server_name }.';

notify pgrst, 'reload schema';
