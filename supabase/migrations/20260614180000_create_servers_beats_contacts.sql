-- Wavloops V3 — migration #2.
-- Core producer data model: servers, beats, server_beats (pivot),
-- contacts (artists), listens, likes. Plus the storage buckets needed
-- for V1 (beat audio + optional server cover images).
--
-- HOW TO APPLY
-- ─────────────
-- Option A — Supabase Dashboard:
--   1. Open: https://supabase.com/dashboard/project/_/sql/new
--   2. Paste this file's contents.
--   3. Click "Run".
--
-- Option B — Supabase CLI: `npx supabase db push`
--
-- Re-runnable: idempotent. Safe to apply twice.

-- ============================================================
-- Helper: resolve the current user's producer profile id.
-- ============================================================
-- Most rows reference `profiles.id`, not `auth.users.id`. This SECURITY
-- DEFINER function lets RLS policies do `owner_id = current_profile_id()`
-- instead of an inline subquery on every check.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- servers
-- ============================================================
create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  style_text text,
  description text,
  artist_types text[] not null default array[]::text[],
  artwork_mode text not null default 'auto'
    check (artwork_mode in ('auto', 'color', 'image')),
  accent_hue int check (accent_hue >= 0 and accent_hue < 360),
  artwork_image_url text,
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists servers_owner_idx on public.servers (owner_id);
create index if not exists servers_slug_idx on public.servers (slug);

drop trigger if exists servers_set_updated_at on public.servers;
create trigger servers_set_updated_at
  before update on public.servers
  for each row execute function public.set_updated_at();

alter table public.servers enable row level security;

-- Owner sees everything.
drop policy if exists servers_owner_select on public.servers;
create policy servers_owner_select on public.servers
  for select to authenticated
  using (owner_id = current_profile_id());

drop policy if exists servers_owner_insert on public.servers;
create policy servers_owner_insert on public.servers
  for insert to authenticated
  with check (owner_id = current_profile_id());

drop policy if exists servers_owner_update on public.servers;
create policy servers_owner_update on public.servers
  for update to authenticated
  using (owner_id = current_profile_id())
  with check (owner_id = current_profile_id());

drop policy if exists servers_owner_delete on public.servers;
create policy servers_owner_delete on public.servers
  for delete to authenticated
  using (owner_id = current_profile_id());

-- Public servers are readable by anyone (for the wavloops.co/s/<slug>
-- gated entry flow). Private servers stay invisible until V1.1 wires
-- the email-gated signed-URL access.
drop policy if exists servers_public_select on public.servers;
create policy servers_public_select on public.servers
  for select to public
  using (visibility = 'public');

-- ============================================================
-- beats (producer library — beats live independently of servers)
-- ============================================================
create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  type text check (type in ('comp', 'loop')),
  bpm int,
  key text,                                -- e.g. "F MIN", "C# MAJ"
  audio_url text,                          -- storage 'beat-audio' bucket
  wave_seed text not null,                 -- deterministic waveform seed
  duration_seconds int,
  mood text[] not null default array[]::text[],
  has_stems boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beats_owner_idx on public.beats (owner_id);

drop trigger if exists beats_set_updated_at on public.beats;
create trigger beats_set_updated_at
  before update on public.beats
  for each row execute function public.set_updated_at();

alter table public.beats enable row level security;

drop policy if exists beats_owner_all on public.beats;
create policy beats_owner_all on public.beats
  for all to authenticated
  using (owner_id = current_profile_id())
  with check (owner_id = current_profile_id());

-- The `beats_public_select` policy needs `server_beats` to exist, so
-- it's defined further down (right after `server_beats` is created).

-- ============================================================
-- server_beats (pivot: a beat belongs to N servers, a server has N beats)
-- ============================================================
create table if not exists public.server_beats (
  server_id uuid not null references public.servers (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (server_id, beat_id)
);

create index if not exists server_beats_beat_idx on public.server_beats (beat_id);

alter table public.server_beats enable row level security;

-- Now that server_beats exists, we can wire the public-read policy on
-- beats. A beat is publicly readable when it's part of a public server.
drop policy if exists beats_public_select on public.beats;
create policy beats_public_select on public.beats
  for select to public
  using (
    exists (
      select 1
      from public.server_beats sb
      join public.servers s on s.id = sb.server_id
      where sb.beat_id = beats.id
        and s.visibility = 'public'
    )
  );

-- Owner of the server (which is also the owner of the beat, by design)
-- can do anything with the membership row.
drop policy if exists server_beats_owner_all on public.server_beats;
create policy server_beats_owner_all on public.server_beats
  for all to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = server_beats.server_id
        and s.owner_id = current_profile_id()
    )
  )
  with check (
    exists (
      select 1 from public.servers s
      where s.id = server_beats.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- Public read for memberships of public servers (artist sees the
-- track listing).
drop policy if exists server_beats_public_select on public.server_beats;
create policy server_beats_public_select on public.server_beats
  for select to public
  using (
    exists (
      select 1 from public.servers s
      where s.id = server_beats.server_id
        and s.visibility = 'public'
    )
  );

-- ============================================================
-- contacts (artists who entered a server via the gated link).
-- Server-scoped: same email used on two servers = two contact rows.
-- ============================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers (id) on delete cascade,
  email text not null,
  name text,
  phone text,
  socials jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  unique (server_id, email)
);

create index if not exists contacts_server_idx on public.contacts (server_id);
create index if not exists contacts_last_active_idx on public.contacts (server_id, last_active_at desc);

alter table public.contacts enable row level security;

-- Producer reads / updates / deletes contacts belonging to their servers.
drop policy if exists contacts_owner_all on public.contacts;
create policy contacts_owner_all on public.contacts
  for all to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = contacts.server_id
        and s.owner_id = current_profile_id()
    )
  )
  with check (
    exists (
      select 1 from public.servers s
      where s.id = contacts.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- Public INSERT — the gated entry form on /s/<slug> creates a contact
-- row anonymously. Constrained to public servers for now (private uses
-- the V1.1 signed-token flow).
drop policy if exists contacts_public_insert on public.contacts;
create policy contacts_public_insert on public.contacts
  for insert to public
  with check (
    exists (
      select 1 from public.servers s
      where s.id = contacts.server_id
        and s.visibility = 'public'
    )
  );

-- ============================================================
-- listens (event log: artist played a beat on a server)
-- ============================================================
create table if not exists public.listens (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  server_id uuid not null references public.servers (id) on delete cascade,
  listened_at timestamptz not null default now(),
  completion_pct real check (completion_pct >= 0 and completion_pct <= 1)
);

create index if not exists listens_server_listened_idx
  on public.listens (server_id, listened_at desc);
create index if not exists listens_beat_idx
  on public.listens (beat_id);

alter table public.listens enable row level security;

-- Producer reads listens for their servers.
drop policy if exists listens_owner_select on public.listens;
create policy listens_owner_select on public.listens
  for select to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = listens.server_id
        and s.owner_id = current_profile_id()
    )
  );

-- Anonymous artist INSERTs a listen event (only on public servers).
drop policy if exists listens_public_insert on public.listens;
create policy listens_public_insert on public.listens
  for insert to public
  with check (
    exists (
      select 1 from public.servers s
      where s.id = listens.server_id
        and s.visibility = 'public'
    )
  );

-- ============================================================
-- likes (artist's per-server heart on a beat)
-- ============================================================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  server_id uuid not null references public.servers (id) on delete cascade,
  liked_at timestamptz not null default now(),
  unique (contact_id, beat_id)
);

create index if not exists likes_server_idx on public.likes (server_id);
create index if not exists likes_beat_idx on public.likes (beat_id);

alter table public.likes enable row level security;

drop policy if exists likes_owner_select on public.likes;
create policy likes_owner_select on public.likes
  for select to authenticated
  using (
    exists (
      select 1 from public.servers s
      where s.id = likes.server_id
        and s.owner_id = current_profile_id()
    )
  );

drop policy if exists likes_public_insert on public.likes;
create policy likes_public_insert on public.likes
  for insert to public
  with check (
    exists (
      select 1 from public.servers s
      where s.id = likes.server_id
        and s.visibility = 'public'
    )
  );

-- Artist can unlike (delete their own like). V1 stub policy — refine
-- with the signed-token check when we wire artist identity properly.
drop policy if exists likes_public_delete on public.likes;
create policy likes_public_delete on public.likes
  for delete to public
  using (
    exists (
      select 1 from public.servers s
      where s.id = likes.server_id
        and s.visibility = 'public'
    )
  );

-- ============================================================
-- Storage buckets
-- ============================================================

-- beat-audio: producer uploads .mp3/.wav, reads gated by RLS to avoid
-- direct download outside the player. NOT public.
insert into storage.buckets (id, name, public)
values ('beat-audio', 'beat-audio', false)
on conflict (id) do nothing;

drop policy if exists beat_audio_insert_own on storage.objects;
create policy beat_audio_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'beat-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists beat_audio_update_own on storage.objects;
create policy beat_audio_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'beat-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists beat_audio_delete_own on storage.objects;
create policy beat_audio_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'beat-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Producer can read their own beat audio.
drop policy if exists beat_audio_select_own on storage.objects;
create policy beat_audio_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'beat-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- server-covers: optional uploaded artwork for the 'image' mode.
-- Public — anyone with the URL can render the cover.
insert into storage.buckets (id, name, public)
values ('server-covers', 'server-covers', true)
on conflict (id) do nothing;

drop policy if exists server_covers_read_public on storage.objects;
create policy server_covers_read_public on storage.objects
  for select to public
  using (bucket_id = 'server-covers');

drop policy if exists server_covers_insert_own on storage.objects;
create policy server_covers_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'server-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists server_covers_update_own on storage.objects;
create policy server_covers_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'server-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists server_covers_delete_own on storage.objects;
create policy server_covers_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'server-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
