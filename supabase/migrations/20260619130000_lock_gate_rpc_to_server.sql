-- Wavloops V3 — migration #35.
-- Security: lock submit_access_request() to the server, so the anon
-- gate form can't be spammed via the public REST endpoint.
--
-- Why
-- ───
-- submit_access_request was granted EXECUTE to `anon`, meaning
-- anyone could POST it directly at
--   /rest/v1/rpc/submit_access_request
-- with the public anon key — bypassing the Next.js gate form
-- entirely. No form = no captcha, no rate-limit, no friction: a
-- script could fabricate thousands of fake contacts + access-request
-- notifications in a producer's account.
--
-- Fix
-- ───
-- Revoke anon EXECUTE. The function now runs only via:
--   - authenticated callers (the signed-in "request access"
--     shortcut on the gate), which keep their grant; and
--   - the Next.js server action, which calls it through the
--     service-role admin client AFTER verifying a Cloudflare
--     Turnstile token (see app/auth/actions.ts + lib/turnstile.ts).
--
-- Net effect: the only anonymous path to this function is the
-- captcha-gated form. The direct-REST spam vector is closed.
--
-- NOTE: get_server_for_gate / get_server_owner_notif_target stay
-- anon-callable on purpose — they're read-only and power the public
-- gate page render. Only the WRITE path is locked down.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste → Run (or applied via the
-- Management API).

revoke execute on function public.submit_access_request(text, text, text)
  from anon;

-- Keep authenticated (signed-in shortcut) + service_role (admin
-- client used by the server action). service_role bypasses grants
-- anyway, but make the intent explicit.
grant execute on function public.submit_access_request(text, text, text)
  to authenticated;

notify pgrst, 'reload schema';
