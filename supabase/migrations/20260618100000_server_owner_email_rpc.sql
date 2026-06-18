-- Wavloops V3 — migration #21.
-- Phase 3.9 — notification email infrastructure.
--
-- get_server_owner_email(p_slug) — SECURITY DEFINER RPC that
-- returns the producer's auth email for a given server slug.
-- Used by claim_server_access cascade callers (callback +
-- requestGateAccessAction) to look up where to send the
-- "access request" notification email.
--
-- Why an RPC: auth.users is not exposed to the standard
-- authenticated role, so the artist (the caller in this flow)
-- can't SELECT it directly. SECURITY DEFINER bypasses that —
-- but the function only ever returns ONE email for a known slug,
-- not an enumerable list, so abuse surface is minimal.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

create or replace function public.get_server_owner_email(p_slug text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  select p.user_id into v_user_id
  from public.servers s
  join public.profiles p on p.id = s.owner_id
  where s.slug = p_slug
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  return v_email;
end;
$$;

revoke all on function public.get_server_owner_email(text) from public;
grant execute on function public.get_server_owner_email(text) to authenticated;

comment on function public.get_server_owner_email is
  'Returns the producer email for the given server slug. Used by the access-request notification cascade. SECURITY DEFINER because auth.users is not readable by the authenticated role.';

notify pgrst, 'reload schema';
