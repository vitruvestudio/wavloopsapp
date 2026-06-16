-- Wavloops V3 — migration #14.
-- Artist-side persistence: profile, notes, comments, notifications.
--
-- Schema rationale
-- ────────────────
-- All four tables key off auth.uid() directly (NOT through contacts)
-- because they belong to the artist as a person, not to the
-- (producer, contact) pair:
--   - An artist has ONE profile across every producer who follows
--     them — same display name / bio / socials.
--   - A private note is the artist's own — the producer never reads
--     it; scoping by contact would duplicate it across producers.
--   - A shared comment IS aimed at one producer (the beat owner),
--     but indexing by user_id + beat_id is cleaner than a third
--     pivot and lets us trivially "comments by this artist".
--   - Notifications target a person, not a (producer, contact) pair.
--
-- listens + likes stay on contact_id (existing design) because they
-- represent activity ON a specific server — the same artist liking
-- the same beat through two different producers' servers SHOULD
-- record as two distinct likes (per-producer engagement counters).
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 0. Shared updated_at trigger
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. artist_profiles — display data shown to producers on
--    /listen + producer-side feedback tab + the artist gate.
-- ============================================================
create table if not exists public.artist_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  /* Display name shown in the topbar chip + dropdown header + as
     the bolded actor on feedback rows. Falls back to email-local-
     part in app code when null. */
  display_name text,
  bio text check (length(coalesce(bio, '')) <= 180),
  avatar_url text,
  /* Same shape as contacts.socials. Keys: instagram, x, youtube,
     genius, website. All optional. */
  socials jsonb not null default '{}'::jsonb,
  /* Toggles wired to the Settings → Notifications tab. Default
     mirrors the artist's first-run experience: activity on,
     reactions off, email channel on, push off. */
  notif_prefs jsonb not null default jsonb_build_object(
    'new_beats',          true,
    'added_to_server',    true,
    'producer_reactions', false,
    'email',              true,
    'push',               false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists artist_profiles_touch on public.artist_profiles;
create trigger artist_profiles_touch
  before update on public.artist_profiles
  for each row execute function public.touch_updated_at();

alter table public.artist_profiles enable row level security;

-- Artist reads + writes their own row.
drop policy if exists artist_profiles_own_all on public.artist_profiles;
create policy artist_profiles_own_all on public.artist_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Producers can READ any artist_profile (so the feedback tab on a
-- beat detail page can render the artist's display name + socials
-- without each row needing extra lookup). No write access.
drop policy if exists artist_profiles_producer_read on public.artist_profiles;
create policy artist_profiles_producer_read on public.artist_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. beat_notes — artist's PRIVATE note on a beat. Producer
--    never sees these. One per (artist, beat).
-- ============================================================
create table if not exists public.beat_notes (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(body) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beat_id, user_id)
);

create index if not exists beat_notes_user_idx
  on public.beat_notes (user_id);

drop trigger if exists beat_notes_touch on public.beat_notes;
create trigger beat_notes_touch
  before update on public.beat_notes
  for each row execute function public.touch_updated_at();

alter table public.beat_notes enable row level security;

drop policy if exists beat_notes_own_all on public.beat_notes;
create policy beat_notes_own_all on public.beat_notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3. beat_comments — artist's SHARED note on a beat. Visible to
--    the producer who owns the beat. Many per (artist, beat)
--    (no unique constraint) so artists can leave several over
--    time as they re-listen.
-- ============================================================
create table if not exists public.beat_comments (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(body) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beat_comments_beat_idx
  on public.beat_comments (beat_id, created_at desc);
create index if not exists beat_comments_user_idx
  on public.beat_comments (user_id, created_at desc);

drop trigger if exists beat_comments_touch on public.beat_comments;
create trigger beat_comments_touch
  before update on public.beat_comments
  for each row execute function public.touch_updated_at();

alter table public.beat_comments enable row level security;

-- Artist owns their comments — full CRUD on their own rows.
drop policy if exists beat_comments_own_all on public.beat_comments;
create policy beat_comments_own_all on public.beat_comments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Producer can READ comments on beats they own. No write access —
-- a producer reacting to a comment lands as a notification on the
-- artist's side, not as a row-update on the comment.
drop policy if exists beat_comments_producer_read on public.beat_comments;
create policy beat_comments_producer_read on public.beat_comments
  for select to authenticated
  using (
    exists (
      select 1
      from public.beats b
      where b.id = beat_comments.beat_id
        and b.owner_id = public.current_profile_id()
    )
  );

-- ============================================================
-- 4. notifications — bell dropdown payload.
--    Generated by triggers on uploads / server-contact pairs /
--    likes etc. (those triggers land alongside the producer-side
--    actions that generate them; this commit just provisions the
--    table + RLS).
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  /* Whose bell this rings. */
  recipient_user_id uuid not null
    references auth.users (id) on delete cascade,
  /* Discrete event kind so the renderer can pick its icon
     without parsing the body. Must match the artist-side
     ArtistNotificationKind union. */
  kind text not null check (kind in (
    'upload',
    'added_to_server',
    'drop',
    'comment_like',
    'trending'
  )),
  /* Bolded actor in the sentence (producer or server name). */
  actor_name text not null,
  /* Avatar seed when no upload exists yet — typically the actor's
     handle. */
  actor_seed text,
  /* Sentence fragment after the actor name. Pre-rendered so the
     renderer stays dumb. */
  body text not null,
  /* Optional row payload — opening the row scrolls to the right
     server / beat depending on kind. */
  server_id uuid references public.servers (id) on delete set null,
  beat_id uuid references public.beats (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_user_id)
  where read = false;

alter table public.notifications enable row level security;

drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications
  for select to authenticated
  using (recipient_user_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
  for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- ============================================================
-- 5. tell PostgREST to reload its schema cache
-- ============================================================
notify pgrst, 'reload schema';
