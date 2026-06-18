-- ============================================================
-- Migration #32 — Harden public-select RLS to anon-only
-- ============================================================
--
-- Critical bug discovered during V2 auth refactor testing:
--
--   The `*_public_select` policies on `servers`, `beats`, and
--   `server_beats` were declared `for select to public`. In
--   Postgres, `public` is a synthetic role that grants the
--   permission to BOTH `anon` AND `authenticated`. So any logged-in
--   user — even an artist freshly signed up with no producer
--   context — could `select` every row tied to a public server.
--
--   Concrete symptom: producer A creates a public server with their
--   beats. Producer B signs up. Producer B's /library and
--   /dashboard fetch `select * from beats_with_stats` and
--   `select * from servers_with_stats` without an explicit
--   owner_id filter, trusting the producer-side `_owner_all`
--   policy to scope. But the `_public_select` policy was satisfying
--   the SELECT first, returning producer A's data inside producer
--   B's Library. Full data leak across producers.
--
-- Fix:
--   1. Narrow each `_public_select` policy from `to public` to
--      `to anon`. Anonymous gate visitors keep their read
--      access. Authenticated users now have to satisfy
--      `_owner_all` (own rows) or `_artist_read` (granted access
--      via a contact row).
--
--   2. The code now also filters by `owner_id` explicitly inside
--      the producer-side server components (/library, /dashboard,
--      etc.). RLS is the fence; explicit filtering is the
--      seatbelt. Both apply.
--
-- This migration is idempotent (drop/create) and re-runnable.
-- ============================================================

-- ── servers ──────────────────────────────────────────────────
drop policy if exists servers_public_select on public.servers;
create policy servers_public_select on public.servers
  for select to anon
  using (visibility = 'public');

-- ── beats ────────────────────────────────────────────────────
drop policy if exists beats_public_select on public.beats;
create policy beats_public_select on public.beats
  for select to anon
  using (
    exists (
      select 1
      from public.server_beats sb
      join public.servers s on s.id = sb.server_id
      where sb.beat_id = beats.id
        and s.visibility = 'public'
    )
  );

-- ── server_beats ─────────────────────────────────────────────
drop policy if exists server_beats_public_select on public.server_beats;
create policy server_beats_public_select on public.server_beats
  for select to anon
  using (
    exists (
      select 1 from public.servers s
      where s.id = server_beats.server_id
        and s.visibility = 'public'
    )
  );

notify pgrst, 'reload schema';
