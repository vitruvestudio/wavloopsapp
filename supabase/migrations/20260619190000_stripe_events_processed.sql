-- Wavloops V3 — migration #38.
-- Stripe webhook idempotency table.
--
-- Why
-- ───
-- Stripe re-delivers webhook events on any non-2xx response and
-- sometimes also on 2xx (network glitches between their side and
-- ours). Each event has a stable `event.id` (e.g. `evt_…`); the
-- safe pattern is: process exactly once, ignore re-deliveries.
--
-- We mark the event as processed AFTER the handler succeeds, so
-- a crashed handler retries on the next delivery. A successfully-
-- handled-but-not-marked event would retry, but the handlers are
-- written to be themselves idempotent (UPDATE same-shape rows,
-- not INSERT) so the worst-case is a wasted write.
--
-- Storage shape
-- ─────────────
-- Just event_id (PK) + type + when. We deliberately do NOT store
-- the event payload — Stripe keeps it forever in their dashboard,
-- and storing 6-figure-byte JSON per event would balloon the
-- table for zero added value.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste → Run (or Management API).

create table if not exists public.stripe_events_processed (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists stripe_events_processed_type_idx
  on public.stripe_events_processed (event_type);

comment on table public.stripe_events_processed is
  'Webhook idempotency log. Insert event_id after a handler succeeds; lookups by PK gate re-deliveries.';

alter table public.stripe_events_processed enable row level security;

-- No policies on purpose — service-role (the webhook) is the
-- only writer/reader. Clients have zero access by design.

notify pgrst, 'reload schema';
