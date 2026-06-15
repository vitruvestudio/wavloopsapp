-- Wavloops V3 — migration #5.
-- Adds `loudness_lufs` to `beats` for the integrated loudness reading
-- (EBU R 128 / ITU-R BS.1770) that the Upload page auto-fills via
-- essentia.js' LoudnessEBUR128 algorithm.
--
-- Range: ~ -70 to 0 LUFS for real-world music. Stored as `real` so
-- decimals like -9.4 survive the round-trip. NULL = analysis failed
-- or the audio was silence.
--
-- HOW TO APPLY
-- ─────────────
-- Dashboard → SQL Editor → paste this file → Run. Idempotent.

alter table public.beats
  add column if not exists loudness_lufs real;

-- `beats_with_stats` is a SELECT * view over beats, so it picks up the
-- new column automatically — no `create or replace view` needed.
