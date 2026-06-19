-- Wavloops V3 — migration #36.
-- Security: stop anon from reading internal profile columns.
--
-- Why
-- ───
-- A live RLS attack test (acting as the anon role) showed the
-- profiles table is readable by anon via the
-- `profiles_select_public` policy (to public USING(true)) with
-- FULL column access. RLS gates rows, not columns — so anon could
-- pull every producer's:
--   - user_id        → the internal auth.users UUID (same leak
--                       class fixed for submit_access_request in
--                       migration #34: an internal identifier has
--                       no business being public).
--   - notif_prefs    → the producer's notification settings JSON.
--   - onboarded_at / created_at / updated_at → internal timestamps.
--
-- No email or token is in this table (email lives in auth.users),
-- so severity is low — but the directory only needs the public
-- presentation fields, so we tighten anon to exactly those.
--
-- Fix
-- ───
-- Postgres can't column-scope an RLS policy, but it CAN column-
-- scope a GRANT. Revoke anon's blanket SELECT and re-grant only
-- the public-directory columns. authenticated / service_role keep
-- full access (the settings page reads its own notif_prefs as
-- authenticated; the gate page reads via the SECURITY DEFINER
-- get_server_for_gate RPC, which runs as definer — neither relies
-- on anon's direct column access).
--
-- Verified before writing: no anon code path SELECTs profiles
-- directly (grep of .from("profiles") — all hits are on the
-- authenticated producer/artist surfaces or the service-role cron).
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste → Run (or Management API).

revoke select on public.profiles from anon;

grant select (
  id,
  handle,
  name,
  avatar_url,
  bio,
  socials,
  certifications,
  placements
) on public.profiles to anon;

notify pgrst, 'reload schema';
