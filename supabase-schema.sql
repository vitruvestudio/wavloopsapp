-- Wavloops — early access onboarding table
-- Run this once in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new

create table public.onboarding_early (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Producer info
  producer_name text not null check (
    char_length(producer_name) between 1 and 200
  ),
  email text not null check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  work_url text not null check (
    char_length(work_url) between 1 and 500
  ),

  -- Qualification
  grow_goals text[] not null default '{}',
  interest_level text not null check (
    interest_level in ('early-access', 'test-real-kit', 'curious')
  ),

  -- Admin
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'waitlisted')
  ),
  notes text,

  -- Anti-spam / debug
  ip_address text,
  user_agent text
);

-- Sort by submission date
create index onboarding_early_created_at_idx
  on public.onboarding_early (created_at desc);

-- One submission per email
create unique index onboarding_early_email_unique
  on public.onboarding_early (lower(email));

-- Enable RLS — Server Actions use the service role key which bypasses RLS.
-- No public policies are defined, so anonymous clients cannot read/write.
alter table public.onboarding_early enable row level security;
