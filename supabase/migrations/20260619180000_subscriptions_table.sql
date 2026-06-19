-- Wavloops V3 — migration #37.
-- Billing foundation: subscriptions table + get_user_plan() helper.
--
-- Why
-- ───
-- The Stripe webhook (Phase 3) writes here on every plan-relevant
-- event (checkout completed, sub updated, sub deleted, etc.). App
-- code reads via get_user_plan() to gate features and quotas.
--
-- Design choices
-- ──────────────
-- 1. ONE row per auth user max. We do NOT create the row eagerly
--    (no trigger on auth.users). Instead, free users have NO row
--    at all — get_user_plan() defaults to 'free' when the row
--    is absent. The row is upserted by the webhook the first
--    time a user actually pays. Keeps the table sparse + the
--    onboarding flow simple.
--
-- 2. Lifetime + Pro are NOT mutually exclusive in the schema:
--    `lifetime_purchased_at` and `stripe_subscription_id` can
--    co-exist on the same row. The resolution order in
--    get_user_plan() picks Pro while the sub is active, falls
--    back to Lifetime otherwise. This lets a Lifetime customer
--    upgrade to Pro later without losing their Lifetime status
--    if they cancel Pro.
--
-- 3. RLS: read-own only. All writes happen from the webhook,
--    which uses the service-role client (bypasses RLS). No
--    direct client writes are allowed — the schema is therefore
--    safe from client-side plan tampering.

-- ============================================================
-- 1) Table
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users (id) on delete cascade
    unique,
  plan text not null default 'free'
    check (plan in ('free','lifetime','pro')),
  status text not null default 'inactive'
    check (status in (
      'inactive','active','trialing','past_due',
      'canceled','incomplete','incomplete_expired','unpaid','paused'
    )),
  -- Stripe linkage
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  -- Pro subscription lifecycle
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- Lifetime one-time purchase marker
  lifetime_purchased_at timestamptz,
  -- Bookkeeping
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'One row per paying user. Free users have no row; get_user_plan() defaults to ''free'' when absent.';
comment on column public.subscriptions.lifetime_purchased_at is
  'Set when a one-time Lifetime purchase completes. Permanent — never cleared by downgrades.';
comment on column public.subscriptions.stripe_subscription_id is
  'Stripe sub id for the active Pro subscription. Null after cancellation, even if Lifetime is set.';

-- ============================================================
-- 2) Indexes — webhook lookups by Stripe ids
-- ============================================================
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

-- ============================================================
-- 3) updated_at trigger (table-scoped to avoid name collisions)
-- ============================================================
create or replace function public.subscriptions_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch_updated_at_trg
  on public.subscriptions;
create trigger subscriptions_touch_updated_at_trg
  before update on public.subscriptions
  for each row execute function public.subscriptions_touch_updated_at();

-- ============================================================
-- 4) RLS — read-own, no client writes
-- ============================================================
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_own_read on public.subscriptions;
create policy subscriptions_own_read on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

-- No insert / update / delete policies on purpose:
-- - service-role bypasses RLS, so the webhook can mutate.
-- - clients are silently blocked from all writes.

-- ============================================================
-- 5) get_user_plan(p_user_id) — single source of truth
-- ============================================================
-- Resolution order:
--   1. Active Pro subscription (status in active/trialing/past_due)
--      → 'pro'. past_due gives a grace period before downgrade —
--      Stripe retries the failed invoice for ~3 weeks and most
--      cards eventually succeed. Downgrading immediately is hostile.
--   2. lifetime_purchased_at is set → 'lifetime'.
--   3. Default → 'free'.
--
-- SECURITY DEFINER + set search_path = public so the function can
-- read across users when called from app code via service-role,
-- but the parameter constraints the result to the requested uid.
create or replace function public.get_user_plan(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when plan = 'pro' and status in ('active','trialing','past_due')
          then 'pro'
        when lifetime_purchased_at is not null
          then 'lifetime'
        else 'free'
      end
      from public.subscriptions
      where user_id = p_user_id
      limit 1
    ),
    'free'
  );
$$;

revoke all on function public.get_user_plan(uuid) from public;
grant execute on function public.get_user_plan(uuid)
  to authenticated, service_role;

comment on function public.get_user_plan is
  'Resolves the effective billing plan for a user: pro (subscription active) > lifetime (one-time) > free.';

notify pgrst, 'reload schema';
