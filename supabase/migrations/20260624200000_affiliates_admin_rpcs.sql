-- Admin-side RPCs for the affiliate program.
--
-- These exist as SQL functions (not flat UPDATE statements from
-- the admin client) wherever an operation must be ATOMIC across
-- multiple rows or columns. PostgREST single-call transactions
-- are limited, so anything more involved than a single UPDATE
-- belongs here.
--
-- All functions are SECURITY DEFINER with a locked search_path,
-- granted to service_role only. The admin route already gates
-- access via isAdminEmail() + assertAdmin(), so the admin client
-- is the only legitimate caller.

set check_function_bodies = off;

/* ============================================================
   admin_record_affiliate_payout
   ────────────────────────────────────────────────────────────
   Records a manual payout to an affiliate and atomically:
     1. Inserts a row in affiliate_payouts with the audit fields
     2. Decrements unpaid_balance_cents
     3. Increments total_paid_cents
     4. Marks the oldest `approved` referrals as `paid` (oldest
        first) up to amount_cents, linking them to the payout id
        so the affiliate's history shows which referrals each
        payout covered.

   Defensive checks:
     - amount must be strictly positive
     - amount must NOT exceed current unpaid_balance_cents
     - affiliate row is FOR UPDATE locked to prevent races against
       a concurrent webhook crediting fresh commissions.

   Raises on violation so the calling action surfaces a friendly
   error message; never silently truncates.
   ============================================================ */

create or replace function public.admin_record_affiliate_payout(
  p_affiliate_id        uuid,
  p_amount_cents        int,
  p_method              text,
  p_external_reference  text,
  p_notes               text,
  p_admin_user_id       uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance       int;
  v_payout_id     uuid;
  v_remaining     int;
  v_total_covered int := 0;
  r_ref           record;
begin
  -- Validate the obvious.
  if p_affiliate_id is null then
    raise exception 'p_affiliate_id is required';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount_cents must be > 0';
  end if;
  if p_method is null or p_method not in ('paypal','wise','stripe_connect','bank','other') then
    raise exception 'method must be one of paypal|wise|stripe_connect|bank|other';
  end if;

  -- Lock the affiliate row so a concurrent webhook can't drop
  -- the balance under our amount mid-transaction.
  select unpaid_balance_cents
    into v_balance
  from public.affiliates
  where id = p_affiliate_id
  for update;

  if v_balance is null then
    raise exception 'Affiliate not found';
  end if;
  if p_amount_cents > v_balance then
    raise exception 'Amount $% exceeds unpaid balance $%',
      to_char(p_amount_cents::numeric/100, 'FM999990.00'),
      to_char(v_balance::numeric/100, 'FM999990.00');
  end if;

  -- Insert payout row first so we have an id for the referral
  -- linking step.
  insert into public.affiliate_payouts (
    affiliate_id,
    amount_cents,
    method,
    external_reference,
    notes,
    created_by_user_id,
    paid_at
  ) values (
    p_affiliate_id,
    p_amount_cents,
    p_method,
    nullif(trim(coalesce(p_external_reference, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_admin_user_id,
    now()
  )
  returning id into v_payout_id;

  -- Update affiliate totals.
  update public.affiliates
  set unpaid_balance_cents = unpaid_balance_cents - p_amount_cents,
      total_paid_cents     = total_paid_cents + p_amount_cents
  where id = p_affiliate_id;

  -- Mark the oldest 'approved' referrals as 'paid' until we
  -- cover the payout amount. We walk by created_at ASC so the
  -- producer's history reads FIFO: oldest commissions get the
  -- first payout. Leaves any remainder un-flagged for the next
  -- payout cycle.
  v_remaining := p_amount_cents;
  for r_ref in
    select id, commission_cents
    from public.affiliate_referrals
    where affiliate_id = p_affiliate_id
      and status = 'approved'
    order by created_at asc
    for update
  loop
    exit when v_remaining <= 0;
    update public.affiliate_referrals
    set status    = 'paid',
        payout_id = v_payout_id,
        paid_at   = now()
    where id = r_ref.id;
    v_remaining     := v_remaining - r_ref.commission_cents;
    v_total_covered := v_total_covered + r_ref.commission_cents;
  end loop;

  -- Note: it's OK for v_remaining to land negative — a single
  -- referral may be larger than the leftover payout we set out
  -- to cover, and we still mark it `paid` since it's been
  -- accounted for in the affiliate's totals. The overshoot
  -- balances itself out in the affiliate-level totals.

  return v_payout_id;
end;
$$;

revoke all on function public.admin_record_affiliate_payout(uuid, int, text, text, text, uuid)
  from public;
grant execute on function public.admin_record_affiliate_payout(uuid, int, text, text, text, uuid)
  to service_role;

/* ============================================================
   admin_set_affiliate_status
   ────────────────────────────────────────────────────────────
   Idempotent status transition. Validates the FROM state so a
   stale UI doesn't reactivate a rejected affiliate, etc.
   ============================================================ */

create or replace function public.admin_set_affiliate_status(
  p_affiliate_id   uuid,
  p_new_status     text,
  p_admin_user_id  uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_new_status not in ('pending','active','suspended','rejected') then
    raise exception 'Invalid status %', p_new_status;
  end if;

  -- Only allowed transitions. We're explicit so the UI can't
  -- shortcut a flow that the business logic relies on (e.g.
  -- never resurrect a 'rejected' affiliate — they have to
  -- reapply).
  update public.affiliates
  set status              = p_new_status,
      approved_at         = case
                              when p_new_status = 'active' and approved_at is null
                                then now()
                              else approved_at
                            end,
      approved_by_user_id = case
                              when p_new_status = 'active' and approved_by_user_id is null
                                then p_admin_user_id
                              else approved_by_user_id
                            end,
      is_active           = (p_new_status = 'active')
  where id = p_affiliate_id
    and (
      -- pending → active|rejected
      (status = 'pending' and p_new_status in ('active','rejected')) or
      -- active → suspended
      (status = 'active' and p_new_status = 'suspended') or
      -- suspended → active
      (status = 'suspended' and p_new_status = 'active')
    );

  if not found then
    raise exception 'Illegal status transition for affiliate %', p_affiliate_id;
  end if;
end;
$$;

revoke all on function public.admin_set_affiliate_status(uuid, text, uuid)
  from public;
grant execute on function public.admin_set_affiliate_status(uuid, text, uuid)
  to service_role;
