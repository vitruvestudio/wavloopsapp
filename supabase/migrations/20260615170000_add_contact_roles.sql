-- Wavloops V3 — migration #9.
-- Add `roles` to contacts so producers can tag each contact's
-- professional role (Producer, Beatmaker, Artist, Rapper, …).
--
-- Why not reuse `servers.artist_types`?
-- Despite the same column shape (text[]), the semantics are
-- opposite directions: `servers.artist_types` tells you who a
-- server is FOR (target audience, e.g. "Drake", "Travis Scott");
-- `contacts.roles` tells you what the contact IS (their craft,
-- e.g. "Producer", "Beatmaker"). Keeping them as separate columns
-- avoids accidental cross-use later.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run. Idempotent.

alter table public.contacts
  add column if not exists roles text[] not null default '{}';

notify pgrst, 'reload schema';
