-- Wavloops V3 — migration #29.
-- Phase 3.10.1 — Per-server download toggle.
--
-- Adds a `downloads_allowed` boolean to public.servers so producers
-- can opt artists in or out of downloading the underlying audio
-- file per server. UI surfaces:
--   - Create / edit server form ships the toggle (default OFF).
--   - Artist-facing beat rows render a download icon (desktop)
--     or a 'Download' item in the 3-dot menu (mobile) ONLY when
--     the row's parent server has downloads_allowed = true.
--   - A dedicated route handler enforces the same gate at the
--     network layer before signing the audio URL — UI hiding
--     alone is not security.
--
-- Defaults to false so existing servers stay closed unless the
-- producer explicitly opens them.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

alter table public.servers
  add column if not exists downloads_allowed boolean
    not null
    default false;

comment on column public.servers.downloads_allowed is
  'When true, granted artists can download the audio file of every beat in this server. Default false. Enforced server-side by the /api/beats/<id>/download route — UI hiding is not security.';

notify pgrst, 'reload schema';
