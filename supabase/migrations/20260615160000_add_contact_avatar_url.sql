-- Wavloops V3 — migration #8.
-- Add `avatar_url` to contacts so the Add-Contact modal's "paste a
-- social link → auto-fill photo" feature has somewhere to store the
-- fetched avatar URL.
--
-- The URL is the public unavatar.io endpoint (or any other publicly
-- reachable image URL). We don't proxy or re-host the bytes — the
-- URL is rendered directly via <img src>. Browsers handle the fetch
-- and CDN/caching. Worst case the image expires and we fall back to
-- the seeded initials Avatar.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run. Idempotent.

alter table public.contacts
  add column if not exists avatar_url text;

notify pgrst, 'reload schema';
