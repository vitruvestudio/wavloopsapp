-- Wavloops V3 — migration #13.
-- Artist auth foundation: link `contacts` rows to the auth user
-- the artist eventually signs in as.
--
-- Why
-- ────
-- A producer adds an artist to a server by creating a contact (name +
-- email + socials). When that artist later signs in via magic link,
-- we want every existing contact row sharing their email to be tied
-- to their auth.users.id so:
--   - the /listen panel can list every producer that's already added
--     them (RLS by auth_user_id, not by owner_id)
--   - listens / likes / beat_notes / beat_comments created from
--     /listen reference their contact, not their auth user, keeping
--     the producer-side data shape intact
--
-- The bind is one-way: producers still own and edit contact metadata
-- (email, name, socials); artists can only READ rows that map back
-- to their auth user, never UPDATE them.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. Column + index
-- ============================================================
alter table public.contacts
  add column if not exists auth_user_id uuid
    references auth.users (id) on delete set null;

create index if not exists contacts_auth_user_idx
  on public.contacts (auth_user_id);

comment on column public.contacts.auth_user_id is
  'Filled by bind_artist_contacts() once the artist sharing this row''s email signs in. Null = contact never claimed.';

-- ============================================================
-- 2. RLS — artist can SELECT their own contact rows across
--    every producer that has them on file. No insert / update —
--    producers own the metadata.
-- ============================================================
drop policy if exists contacts_artist_read on public.contacts;
create policy contacts_artist_read on public.contacts
  for select to authenticated
  using (auth_user_id = auth.uid());

-- ============================================================
-- 3. bind_artist_contacts() — server-side RPC called from the
--    auth callback after a successful magic-link exchange.
--    Updates every contact row whose email matches the current
--    authed user's email and whose auth_user_id is still null
--    (or stale).
--
--    SECURITY DEFINER so it can write across producers' rows
--    without each producer's contacts_owner_all policy gating
--    the update. The where-clause restricts strictly to rows
--    matching the JWT's email + uid, so the function cannot be
--    misused to claim someone else's contact.
-- ============================================================
create or replace function public.bind_artist_contacts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid uuid;
  v_count integer;
begin
  v_uid := auth.uid();
  v_email := (auth.jwt() ->> 'email');

  if v_uid is null or v_email is null then
    return 0;
  end if;

  update public.contacts
     set auth_user_id = v_uid
   where lower(email) = lower(v_email)
     and (auth_user_id is null or auth_user_id <> v_uid);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.bind_artist_contacts from public;
grant execute on function public.bind_artist_contacts to authenticated;

comment on function public.bind_artist_contacts is
  'Claims every contact row matching the authed user''s email. Called from /auth/callback after successful magic-link sign-in.';

notify pgrst, 'reload schema';
