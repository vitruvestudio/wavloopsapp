-- Affiliate program — V1 in-house tables + RPCs.
--
-- Shape
-- ─────
--   affiliates             one row per approved affiliate. Linked
--                          (optional) to an auth user so producers
--                          can claim their affiliate profile from
--                          inside the app. Carries the public
--                          handle that becomes the ?ref= parameter.
--   affiliate_referrals    one row per attributed conversion. Born
--                          'pending' on signup (cookie was set),
--                          flipped to 'approved' on first paid
--                          conversion, then 'paid' once we payout,
--                          or 'refunded' on charge.refunded.
--   affiliate_payouts      one row per cash transfer to an affiliate.
--                          Manual entries by admin until Stripe
--                          Connect Express is wired up.
--
-- Money is stored in cents (int) everywhere. Commission rate is a
-- numeric ratio (0.30 = 30%). The webhook computes commission_cents
-- = floor(gross_amount_cents * commission_rate); the floor avoids
-- handing out fractional cents we can't pay out.
--
-- RLS keeps each affiliate scoped to their own rows; all writes go
-- through the service-role admin client (webhook + admin surface
-- only), so the policies below are read-only for the affiliate
-- themselves. The public.affiliate_handle_active(handle) helper
-- is exposed as a SECURITY DEFINER RPC so the gate / signup flow
-- can validate a handle without granting anon SELECT on the table.

set check_function_bodies = off;

/* ============================================================
   1. affiliates
   ============================================================ */
create table public.affiliates (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        references auth.users (id) on delete set null,
  handle             text        not null,
  email              text        not null,
  display_name       text,
  payout_method      text        not null default 'paypal',  -- 'paypal' | 'wise' | 'stripe_connect' | 'bank'
  payout_email       text,
  payout_notes       text,
  commission_rate    numeric(4,3) not null default 0.30
                       check (commission_rate >= 0 and commission_rate <= 1),
  total_earned_cents int         not null default 0 check (total_earned_cents >= 0),
  total_paid_cents   int         not null default 0 check (total_paid_cents >= 0),
  unpaid_balance_cents int       not null default 0 check (unpaid_balance_cents >= 0),
  status             text        not null default 'pending'
                       check (status in ('pending', 'active', 'suspended', 'rejected')),
  application_note   text,                       -- the "why you?" pitch they wrote
  audience_size      int,                        -- self-declared IG / YT followers etc.
  audience_platform  text,                       -- 'instagram' | 'youtube' | 'twitter' | 'tiktok' | 'mixed'
  approved_at        timestamptz,
  approved_by_user_id uuid       references auth.users (id) on delete set null,
  is_active          boolean     not null default true,
  created_at         timestamptz not null default now(),

  -- handles are public — case-insensitive uniqueness so MIKE40 and
  -- mike40 don't collide and a typo doesn't spawn a duplicate row.
  constraint affiliates_handle_format_chk
    check (handle ~ '^[a-zA-Z0-9_-]{2,32}$')
);

-- Unique on lower(handle) so case differences don't matter at the
-- URL level. A regular index on handle is implicit from primary
-- key on the unique index below.
create unique index affiliates_handle_lower_uq
  on public.affiliates (lower(handle));

create index affiliates_user_id_idx
  on public.affiliates (user_id) where user_id is not null;

create index affiliates_status_idx
  on public.affiliates (status) where status in ('active', 'pending');

/* ============================================================
   2. affiliate_payouts
   Created before referrals because referrals.payout_id FKs here.
   ============================================================ */
create table public.affiliate_payouts (
  id                  uuid        primary key default gen_random_uuid(),
  affiliate_id        uuid        not null references public.affiliates (id) on delete cascade,
  amount_cents        int         not null check (amount_cents > 0),
  paid_at             timestamptz not null default now(),
  method              text        not null,
  external_reference  text,                          -- PayPal TX, Wise ID, Stripe Transfer
  notes               text,
  created_by_user_id  uuid        references auth.users (id) on delete set null,
  created_at          timestamptz not null default now()
);

create index affiliate_payouts_affiliate_idx
  on public.affiliate_payouts (affiliate_id, paid_at desc);

/* ============================================================
   3. affiliate_referrals
   ============================================================ */
create table public.affiliate_referrals (
  id                  uuid        primary key default gen_random_uuid(),
  affiliate_id        uuid        not null references public.affiliates (id) on delete cascade,
  attributed_user_id  uuid        references auth.users (id) on delete set null,
  stripe_customer_id  text,
  stripe_payment_intent_id text,
  stripe_subscription_id   text,
  stripe_invoice_id        text,
  plan_key            text        check (plan_key in ('lifetime', 'pro_monthly', 'pro_yearly')),
  gross_amount_cents  int         not null default 0,
  commission_cents    int         not null default 0,
  status              text        not null default 'pending'
                       check (status in ('pending', 'approved', 'paid', 'refunded', 'expired')),
  attribution_started_at timestamptz not null default now(),
  converted_at        timestamptz,
  refunded_at         timestamptz,
  paid_at             timestamptz,
  payout_id           uuid        references public.affiliate_payouts (id) on delete set null,
  -- For Lifetime / one-time conversions recurrence_index stays 0.
  -- For Pro subscriptions we mint one row per invoice (1..12)
  -- so the affiliate sees a stream of monthly commissions until
  -- the cap. The unique index below keeps each invoice idempotent.
  recurrence_index    int         not null default 0,
  notes               text,
  created_at          timestamptz not null default now()
);

create index affiliate_referrals_affiliate_status_idx
  on public.affiliate_referrals (affiliate_id, status);

create index affiliate_referrals_attributed_user_idx
  on public.affiliate_referrals (attributed_user_id)
  where attributed_user_id is not null;

create index affiliate_referrals_pending_user_idx
  on public.affiliate_referrals (attributed_user_id)
  where status = 'pending';

create unique index affiliate_referrals_invoice_recurrence_uq
  on public.affiliate_referrals (stripe_invoice_id, recurrence_index)
  where stripe_invoice_id is not null;

create unique index affiliate_referrals_payment_intent_uq
  on public.affiliate_referrals (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null and recurrence_index = 0;

/* ============================================================
   4. RPC — increment_affiliate_earnings
   Used by the webhook to atomically bump the affiliate balance
   when a referral converts. SECURITY DEFINER so we don't have to
   grant authenticated UPDATE on affiliates.
   ============================================================ */
create or replace function public.increment_affiliate_earnings(
  p_affiliate_id uuid,
  p_amount_cents int
) returns void
language sql
security definer
set search_path = public
as $$
  update public.affiliates
  set total_earned_cents = total_earned_cents + p_amount_cents,
      unpaid_balance_cents = unpaid_balance_cents + p_amount_cents
  where id = p_affiliate_id;
$$;

revoke all on function public.increment_affiliate_earnings(uuid, int) from public;
grant execute on function public.increment_affiliate_earnings(uuid, int) to service_role;

/* ============================================================
   5. RPC — clawback_affiliate_commission
   Used by the webhook on charge.refunded. Marks the referral
   refunded and decrements the affiliate balance (never below 0
   so a chargeback after a previous payout doesn't create a
   negative balance we'd have to chase).
   ============================================================ */
create or replace function public.clawback_affiliate_commission(
  p_referral_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id   uuid;
  v_commission     int;
  v_already_clawed boolean;
begin
  select affiliate_id, commission_cents, status = 'refunded'
    into v_affiliate_id, v_commission, v_already_clawed
  from public.affiliate_referrals
  where id = p_referral_id;

  if v_affiliate_id is null then
    return;
  end if;

  if v_already_clawed then
    -- Idempotent: webhook retries shouldn't double-clawback.
    return;
  end if;

  update public.affiliate_referrals
  set status      = 'refunded',
      refunded_at = now()
  where id = p_referral_id;

  -- Clamp to zero — a refund larger than the unpaid balance just
  -- empties the balance; we don't reach into already-paid funds.
  update public.affiliates
  set unpaid_balance_cents =
        greatest(0, unpaid_balance_cents - v_commission),
      total_earned_cents =
        greatest(0, total_earned_cents - v_commission)
  where id = v_affiliate_id;
end;
$$;

revoke all on function public.clawback_affiliate_commission(uuid) from public;
grant execute on function public.clawback_affiliate_commission(uuid) to service_role;

/* ============================================================
   6. RPC — resolve_affiliate_handle
   Public-callable validator used during attribution. Returns
   the affiliate id when the handle resolves to an ACTIVE
   affiliate, null otherwise. Anon CAN call this — knowing
   whether a handle exists isn't sensitive (it's literally
   displayed publicly in the affiliate's share link).
   ============================================================ */
create or replace function public.resolve_affiliate_handle(p_handle text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.affiliates
  where lower(handle) = lower(p_handle)
    and status = 'active'
    and is_active = true
  limit 1;
$$;

revoke all on function public.resolve_affiliate_handle(text) from public;
grant execute on function public.resolve_affiliate_handle(text)
  to anon, authenticated, service_role;

/* ============================================================
   7. RLS
   ============================================================ */
alter table public.affiliates             enable row level security;
alter table public.affiliate_referrals    enable row level security;
alter table public.affiliate_payouts      enable row level security;

-- Affiliates: an authenticated affiliate can SELECT their own row
-- (the dashboard reads it). All writes are service-role only.
create policy "affiliates_self_select"
  on public.affiliates
  for select
  to authenticated
  using (user_id = auth.uid());

-- Referrals: affiliate sees their own conversion history.
create policy "affiliate_referrals_self_select"
  on public.affiliate_referrals
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = auth.uid()
    )
  );

-- Payouts: affiliate sees their own payout history.
create policy "affiliate_payouts_self_select"
  on public.affiliate_payouts
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = auth.uid()
    )
  );

-- Anon application path needs to insert a 'pending' affiliates
-- row (the public /affiliate signup form). RLS lets that happen
-- but ONLY in 'pending' status — the form can't grant itself
-- approval. Admin approves via service-role from /admin.
create policy "affiliates_anon_application_insert"
  on public.affiliates
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and approved_at is null
    and total_earned_cents = 0
    and total_paid_cents = 0
    and unpaid_balance_cents = 0
  );

comment on table public.affiliates is
  'Affiliate program participants. Created via /affiliate signup form (status=pending) and approved by admin (status=active).';
comment on table public.affiliate_referrals is
  'One row per attributed conversion. Status pending → approved (paid by customer) → paid (paid out to affiliate) or refunded.';
comment on table public.affiliate_payouts is
  'Manual or auto-transferred payouts to affiliates. Each payout is linked back from the referrals it covered.';
