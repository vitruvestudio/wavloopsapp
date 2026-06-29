-- ============================================================
-- contact_nurture_sequence
--
-- Tracks who has received which step of the producer-nurture
-- email sequence and why a contact stopped receiving more.
--
-- Dedup scope is GLOBAL per person, not per contact:
--   - When auth_user_id is set, that's the dedup key — Marc joining
--     two different producers' servers gets the sequence once total,
--     ever, not once per producer.
--   - Before sign-in (auth_user_id null), the email column is the
--     fallback dedup key.
-- The two partial unique indexes below enforce both shapes.
--
-- The cron processes rows by reading first_seen_at + current_step
-- + status: a row with status='pending' and last_sent_at + step
-- interval elapsed is due for the next email.
--
-- Status state machine:
--   pending            → still in the funnel, more emails to send
--   completed_normal   → all 4 emails delivered, sequence done
--   converted          → contact onboarded as a producer mid-funnel
--                        (the goal of the funnel — we stop sending
--                        the moment we see profiles.onboarded_at)
--   unsubscribed       → user clicked the unsub link (we'll wire
--                        this through the cron when the unsub
--                        endpoint ships)
--   bounced            → Resend webhook flagged a hard bounce
-- Once a non-pending status lands, the row stays in the table as
-- a permanent record but never sends another email.
-- ============================================================

create table if not exists public.contact_nurture_sequence (
  id uuid primary key default gen_random_uuid(),
  -- One contact_id is enough for the cron to look up engagement
  -- + auth state. Cascade-on-delete so removing a contact wipes
  -- their sequence record too — no orphans.
  contact_id uuid not null
    references public.contacts (id) on delete cascade,
  -- Dedup-by-person fields. auth_user_id is filled in by the cron
  -- the first time it sees the contact post-sign-in; email is
  -- always populated (= contact.email at insert time).
  auth_user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  -- Which step the cron has marked AS SENT. NULL means nothing
  -- has gone out yet — the welcome email is step 1 the first time
  -- the cron picks the row up.
  current_step int,
  status text not null default 'pending'
    check (status in (
      'pending',
      'completed_normal',
      'converted',
      'unsubscribed',
      'bounced'
    )),
  -- Last successful send timestamp; the cron checks this against
  -- the step interval to decide whether the next step is due.
  last_sent_at timestamptz,
  -- Stamped when status flips to a non-pending value, paired with
  -- the reason so analytics can split converted vs unsub vs bounce.
  completed_at timestamptz,
  completion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_nurture_sequence_contact_idx
  on public.contact_nurture_sequence (contact_id);

create index if not exists contact_nurture_sequence_status_idx
  on public.contact_nurture_sequence (status, last_sent_at)
  where status = 'pending';

-- Dedup-by-person: one sequence row per auth_user_id when known,
-- and one per email otherwise. The partial indexes mean a row
-- with auth_user_id null doesn't block a future row with the same
-- email but a real auth_user_id (and vice versa for the email
-- fallback). The cron handles the migration explicitly when it
-- spots a contact whose auth_user_id became known.
create unique index if not exists
  contact_nurture_sequence_auth_user_uniq
  on public.contact_nurture_sequence (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists
  contact_nurture_sequence_email_uniq
  on public.contact_nurture_sequence (lower(email))
  where auth_user_id is null;

-- updated_at trigger to match every other table in the schema.
drop trigger if exists contact_nurture_sequence_set_updated_at
  on public.contact_nurture_sequence;
create trigger contact_nurture_sequence_set_updated_at
  before update on public.contact_nurture_sequence
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────
-- Producers can SELECT their own contacts' sequence rows for
-- future analytics ("how many of my contacts are still in the
-- nurture funnel"). INSERT / UPDATE / DELETE are service-role
-- only — the cron and the unsub endpoint use the admin client.
-- Locking writes down to the cron stops a producer from
-- arbitrarily marking a contact as converted or replaying the
-- sequence by hand.
alter table public.contact_nurture_sequence enable row level security;

drop policy if exists contact_nurture_sequence_owner_select
  on public.contact_nurture_sequence;
create policy contact_nurture_sequence_owner_select
  on public.contact_nurture_sequence
  for select
  to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = contact_nurture_sequence.contact_id
        and c.owner_id = current_profile_id()
    )
  );

notify pgrst, 'reload schema';
