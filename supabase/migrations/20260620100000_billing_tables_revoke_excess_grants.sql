-- Wavloops V3 — migration #39.
-- Defense-in-depth on the billing tables.
--
-- Why
-- ───
-- `subscriptions` and `stripe_events_processed` ship with the
-- default Supabase table-level grants (anon + authenticated each
-- hold INSERT / UPDATE / DELETE / TRUNCATE / REFERENCES / TRIGGER).
-- RLS already stops every write on subscriptions (no insert/update/
-- delete policy = silent deny) and stops *everything* on
-- stripe_events_processed (RLS enabled, zero policies). A live
-- audit (2026-06-20) confirmed an authenticated user attempting to
-- update their own plan = 0 rows touched.
--
-- But: if a future migration accidentally adds an over-permissive
-- policy, the table-level grant is the only remaining gate. The
-- standing rule on these tables is "service-role only writes,
-- clients only read their own subscription". So we strip the
-- table-level grants down to that.
--
-- After this migration
-- ────────────────────
-- subscriptions:
--   - anon            : nothing
--   - authenticated   : SELECT only (RLS still scopes to own row)
--   - postgres / service_role : full (writers are the webhook +
--                       getOrCreateStripeCustomer, both use the
--                       service-role client)
-- stripe_events_processed:
--   - anon            : nothing
--   - authenticated   : nothing (this is an internal log)
--   - postgres / service_role : full

-- ============================================================
-- subscriptions
-- ============================================================
revoke all on table public.subscriptions from anon;
revoke all on table public.subscriptions from authenticated;
grant select on table public.subscriptions to authenticated;

-- ============================================================
-- stripe_events_processed
-- ============================================================
revoke all on table public.stripe_events_processed from anon;
revoke all on table public.stripe_events_processed from authenticated;

notify pgrst, 'reload schema';
