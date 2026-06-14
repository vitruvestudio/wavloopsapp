-- Wavloops V3 — first migration.
-- Creates the producer `profiles` table + the `avatars` storage bucket
-- with the row-level + storage policies needed for the onboarding wizard
-- to save data safely from the client.
--
-- HOW TO APPLY
-- ─────────────
-- Option A — Supabase Dashboard (fastest, V1):
--   1. Open: https://supabase.com/dashboard/project/_/sql/new
--   2. Paste the contents of this file.
--   3. Click "Run". Done.
--
-- Option B — Supabase CLI (preferred once we have multiple migrations):
--   npx supabase db push
--
-- Re-runnable: every statement uses `if not exists` / `on conflict` /
-- `drop policy if exists` so applying it twice is a no-op.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  handle text unique,
  name text,
  avatar_url text,
  bio text,
  socials jsonb not null default '{}'::jsonb,
  certifications text[] not null default array[]::text[],
  placements jsonb not null default '[]'::jsonb,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- profiles RLS
-- ============================================================
alter table public.profiles enable row level security;

-- Anyone can SELECT a profile (producer profiles are public — artists
-- see them through gated server links).
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles
  for select
  using (true);

-- Authenticated users INSERT their own row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Authenticated users UPDATE their own row.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated users DELETE their own row (account self-deletion).
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- Storage: avatars bucket
-- ============================================================
-- Public bucket — readable by everyone (avatars are public).
-- Writes restricted to a folder named after the user's id, e.g.
-- `<user_id>/avatar.jpg`. The folder-level check in the policy enforces
-- that producers can only touch their own files.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
