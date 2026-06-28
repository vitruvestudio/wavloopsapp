-- ============================================================
-- server_slug_aliases
--
-- Lets the producer rename a server without breaking any link
-- they've already shared. When updateServerAction detects the
-- name change produced a new slug, it inserts the OLD slug here
-- linked to the server_id. The /s/[slug] + /listen/[slug] routes
-- consult this table when a slug lookup misses on `servers`, and
-- 301-redirect to the canonical (current) slug.
--
-- The alias is the PK so a slug can only point to one server at a
-- time. server_id is FK-cascaded so deleting the server cleans up
-- its aliases automatically.
--
-- RLS
-- ───
-- SELECT is open to anon + authenticated because the redirect on
-- /s/[slug] runs anonymously (gate page is public). The data is
-- non-sensitive — at most a producer's previous slug — and the
-- lookup is bounded by the redirect target, which then re-runs
-- the normal RLS-gated server fetch.
--
-- INSERT and DELETE are owner-only via the same shape as
-- server_beats_owner_all: the caller must own the server the
-- alias points at. The producer-side action runs as the
-- authenticated owner, so the policy passes.
-- ============================================================

create table if not exists public.server_slug_aliases (
  alias text primary key,
  server_id uuid not null
    references public.servers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists server_slug_aliases_server_idx
  on public.server_slug_aliases (server_id);

alter table public.server_slug_aliases enable row level security;

-- Anyone can read — needed for the public gate's redirect path.
drop policy if exists server_slug_aliases_public_select
  on public.server_slug_aliases;
create policy server_slug_aliases_public_select
  on public.server_slug_aliases
  for select
  to public
  using (true);

-- Owner-only write. Mirrors server_beats_owner_all's shape.
drop policy if exists server_slug_aliases_owner_insert
  on public.server_slug_aliases;
create policy server_slug_aliases_owner_insert
  on public.server_slug_aliases
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.servers s
      where s.id = server_slug_aliases.server_id
        and s.owner_id = current_profile_id()
    )
  );

drop policy if exists server_slug_aliases_owner_delete
  on public.server_slug_aliases;
create policy server_slug_aliases_owner_delete
  on public.server_slug_aliases
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = server_slug_aliases.server_id
        and s.owner_id = current_profile_id()
    )
  );

notify pgrst, 'reload schema';
