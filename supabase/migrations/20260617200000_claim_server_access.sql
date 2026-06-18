-- Wavloops V3 — migration #19.
-- claim_server_access(p_slug) — SECURITY DEFINER RPC called from
-- the gate page (/s/[slug]) flow. Two entry points:
--
--   (a) Auth callback (/auth/callback?claim=<slug>) — fired right
--       after the artist exchanges a magic-link code for a session.
--       The callback first runs bind_artist_contacts() to link any
--       pre-created contact rows the producer added by email, then
--       calls this RPC with the slug to grant access to the
--       specific server they were invited to.
--
--   (b) Already-authed shortcut — when a logged-in artist hits a
--       gate link directly, the gate action calls this RPC
--       in-line (no email round-trip needed), then redirects to
--       /listen/<slug>.
--
-- The function is idempotent on both writes:
--   - contacts.UNIQUE(owner_id, email) means a second call for the
--     same artist refreshes auth_user_id (if it was null) and
--     bumps last_active_at; never duplicates.
--   - server_contacts.PK(server_id, contact_id) silences a second
--     grant for the same (artist, server) pair.
--
-- Returns the contact_id on success, or NULL when the caller isn't
-- authed or the slug doesn't resolve. The caller decides what to do
-- on NULL (callback logs + still redirects; the in-line shortcut
-- surfaces the error to the form).
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.
-- (See per-Theo note: migrations are not auto-applied — manual paste
--  into the SQL Editor until the CLI is wired.)

create or replace function public.claim_server_access(p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_server_id uuid;
  v_owner_id uuid;
  v_contact_id uuid;
begin
  if v_uid is null or coalesce(v_email, '') = '' then
    return null;
  end if;

  -- Resolve the server. RLS doesn't apply here (security definer),
  -- so we can read across owners — but we only look up a single slug
  -- the caller already knows.
  select id, owner_id into v_server_id, v_owner_id
  from public.servers
  where slug = p_slug
  limit 1;

  if v_server_id is null then
    return null;
  end if;

  -- Upsert the contact. Two pre-states are possible:
  --   1. Producer already added this artist by email → row exists
  --      with auth_user_id = null. We set it now.
  --   2. Brand-new contact → row created with auth_user_id set.
  -- Either way, last_active_at gets bumped.
  insert into public.contacts (owner_id, email, auth_user_id, last_active_at)
  values (v_owner_id, v_email, v_uid, now())
  on conflict (owner_id, email) do update set
    auth_user_id = coalesce(public.contacts.auth_user_id, excluded.auth_user_id),
    last_active_at = now()
  returning id into v_contact_id;

  -- Grant access to this server. PK(server_id, contact_id) makes
  -- the second call a no-op.
  insert into public.server_contacts (server_id, contact_id, granted_at)
  values (v_server_id, v_contact_id, now())
  on conflict (server_id, contact_id) do nothing;

  return v_contact_id;
end;
$$;

revoke all on function public.claim_server_access(text) from public;
grant execute on function public.claim_server_access(text) to authenticated;

comment on function public.claim_server_access is
  'Idempotent claim from /s/[slug]: upserts the contact (linking auth_user_id) and grants server access. Returns contact_id, or null when unauthed / slug missing.';

notify pgrst, 'reload schema';
