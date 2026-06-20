-- Wavloops V3 — migration #40.
-- TOCTOU fix on plan-quota gates for servers / beats / contacts.
--
-- Why
-- ───
-- The TypeScript gates in lib/billing/gates.ts (checkServerQuota,
-- checkBeatQuota, checkArtistQuota) read usage, compare to plan
-- limit, then return ok=true. The mutating server action that
-- follows runs the INSERT in a separate round-trip. Between
-- the gate returning true and the INSERT committing, a *second*
-- request from the same user (e.g. two browser tabs both clicking
-- Create) can also read the pre-INSERT count, also pass the gate,
-- and also INSERT. A Free user (1 server cap) ends up with 2.
--
-- The fix runs server-side, in the same transaction as the INSERT,
-- with a per-user advisory lock so concurrent inserts queue up.
-- The trigger also re-derives the limit from get_user_plan() so it
-- enforces the *current* plan even if the TypeScript snapshot is
-- stale.
--
-- Plans + limits (mirrored from lib/billing/plans.ts)
-- ───────────────────────────────────────────────────
--   servers : free 1     · lifetime 3   · pro unlimited
--   beats   : free 15    · lifetime 150 · pro unlimited
--   contacts: free 25    · lifetime 500 · pro 1000
--
-- A NULL limit means "unlimited" and skips the count check.
--
-- TypeScript gates stay in place
-- ──────────────────────────────
-- The lib/billing/gates.ts gates aren't removed. They produce the
-- friendly upgrade-modal copy (reason string + plan + usage
-- numbers) that the UI needs to render the UpgradeRequiredModal.
-- The triggers are pure backstop — they raise a generic check
-- violation, the action turns it into a graceful "could not
-- create" error. If a non-malicious user ever hits the trigger,
-- the gate caught them first and surfaced the modal; if the gate
-- was raced, the trigger surfaces a generic error and the UI
-- nudges them to refresh. The race window is narrow enough that
-- this UX trade-off is acceptable.

-- ============================================================
-- Helper — resolve the owner_id (profile.id) to user_id and
-- compute the plan-derived row-count cap for a given resource.
-- ============================================================

create or replace function public.quota_cap_for_owner(
  p_owner_id uuid,
  p_resource text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan text;
begin
  -- Resolve owner_id → user_id via profiles. RLS off because
  -- SECURITY DEFINER; this is internal trigger plumbing.
  select user_id into v_user_id
    from public.profiles
    where id = p_owner_id;

  if v_user_id is null then
    -- Defensive: an INSERT with no profile shouldn't reach here
    -- (other RLS rules block it), but if it does, treat as zero
    -- quota so the trigger blocks.
    return 0;
  end if;

  v_plan := public.get_user_plan(v_user_id);

  -- NULL = unlimited. Caller must skip the count check in that case.
  return case p_resource
    when 'servers' then
      case v_plan when 'free' then 1
                  when 'lifetime' then 3
                  when 'pro' then null
                  else 1 end
    when 'beats' then
      case v_plan when 'free' then 15
                  when 'lifetime' then 150
                  when 'pro' then null
                  else 15 end
    when 'contacts' then
      case v_plan when 'free' then 25
                  when 'lifetime' then 500
                  when 'pro' then 1000
                  else 25 end
    else null
  end;
end;
$$;

revoke all on function public.quota_cap_for_owner(uuid, text) from public;
grant execute on function public.quota_cap_for_owner(uuid, text) to authenticated, service_role;

-- ============================================================
-- Trigger function — servers
-- ============================================================

create or replace function public.enforce_servers_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_count integer;
  v_user_id uuid;
begin
  -- Per-user serialization: two concurrent inserts for the same
  -- owner queue on this lock and run sequentially. Other users
  -- are unaffected — the lock key is scoped to their user_id.
  -- Released automatically at transaction commit/rollback.
  select user_id into v_user_id from public.profiles where id = new.owner_id;
  if v_user_id is not null then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':servers'));
  end if;

  v_cap := public.quota_cap_for_owner(new.owner_id, 'servers');
  if v_cap is null then
    -- Unlimited (Pro). Skip the count check.
    return new;
  end if;

  select count(*) into v_count from public.servers where owner_id = new.owner_id;
  if v_count >= v_cap then
    raise exception 'Plan quota exceeded: % servers (cap %)', v_count, v_cap
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_servers_quota on public.servers;
create trigger trg_enforce_servers_quota
  before insert on public.servers
  for each row
  execute function public.enforce_servers_quota();

-- ============================================================
-- Trigger function — beats
-- ============================================================

create or replace function public.enforce_beats_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_count integer;
  v_user_id uuid;
begin
  select user_id into v_user_id from public.profiles where id = new.owner_id;
  if v_user_id is not null then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':beats'));
  end if;

  v_cap := public.quota_cap_for_owner(new.owner_id, 'beats');
  if v_cap is null then
    return new;
  end if;

  select count(*) into v_count from public.beats where owner_id = new.owner_id;
  if v_count >= v_cap then
    raise exception 'Plan quota exceeded: % beats (cap %)', v_count, v_cap
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_beats_quota on public.beats;
create trigger trg_enforce_beats_quota
  before insert on public.beats
  for each row
  execute function public.enforce_beats_quota();

-- ============================================================
-- Trigger function — contacts
-- ============================================================

create or replace function public.enforce_contacts_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_count integer;
  v_user_id uuid;
begin
  select user_id into v_user_id from public.profiles where id = new.owner_id;
  if v_user_id is not null then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':contacts'));
  end if;

  v_cap := public.quota_cap_for_owner(new.owner_id, 'contacts');
  if v_cap is null then
    return new;
  end if;

  select count(*) into v_count from public.contacts where owner_id = new.owner_id;
  if v_count >= v_cap then
    raise exception 'Plan quota exceeded: % contacts (cap %)', v_count, v_cap
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_contacts_quota on public.contacts;
create trigger trg_enforce_contacts_quota
  before insert on public.contacts
  for each row
  execute function public.enforce_contacts_quota();

notify pgrst, 'reload schema';
