-- Wavloops V3 — migration #20.
-- Phase 3.8.5 — Private-server approval flow.
--
-- A row in server_contacts now carries a status:
--   - 'pending' → artist requested access via /s/[slug] on a private
--                 server; producer hasn't approved yet. RLS hides
--                 the server / beats from the artist until they
--                 do.
--   - 'granted' → access is live. Either auto-set on public-server
--                 claims, or set by the producer's Approve action.
--
-- Public servers always end up at 'granted' (claim_server_access
-- branches on visibility). Manually-added contacts via the
-- producer's "Add artist" modal also default to 'granted' (the
-- column default) — the producer explicitly added them, no review
-- needed.
--
-- Decline is a DELETE — no 'denied' value in the enum, per Theo's
-- call. Artist can re-request later (RPC is idempotent).
--
-- Producer signal: claim_server_access also INSERTs a notification
-- row (kind='access_request') into the notifications table when a
-- pending row lands. The bell dropdown that consumes those rows
-- ships in Phase 3.9 — the data is already there waiting when it
-- arrives.
--
-- HOW TO APPLY
-- ────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. server_contacts.status — pending / granted
-- ============================================================
alter table public.server_contacts
  add column if not exists status text not null default 'granted';

alter table public.server_contacts
  drop constraint if exists server_contacts_status_check;
alter table public.server_contacts
  add constraint server_contacts_status_check
  check (status in ('pending', 'granted'));

-- granted_at becomes nullable — pending rows have no granted_at
-- yet. It's filled on approve.
alter table public.server_contacts
  alter column granted_at drop not null;

-- requested_at — when the row was created, regardless of approval
-- status. Separate from granted_at so the producer can see "this
-- artist requested 2 days ago, still pending" without overloading
-- granted_at. Old rows backfill to now() (we don't have the
-- original request times for previously-added contacts).
alter table public.server_contacts
  add column if not exists requested_at timestamptz not null default now();

-- Partial index for the producer's Requests tab — small footprint
-- since most rows are 'granted' over time.
create index if not exists server_contacts_pending_idx
  on public.server_contacts (server_id)
  where status = 'pending';

-- ============================================================
-- 2. notifications.kind — add 'access_request'
-- ============================================================
alter table public.notifications
  drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in (
    'upload',
    'added_to_server',
    'drop',
    'comment_like',
    'trending',
    'access_request'
  ));

-- ============================================================
-- 3. RLS helpers — must filter on status='granted' so a pending
--    artist can NOT read the server / its beats. Otherwise the
--    approval gate is theatre.
-- ============================================================

-- 3a. Server read — artist sees a server only if their contact has
--     a granted membership on it.
create or replace function public.artist_can_read_server(p_server_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from server_contacts sc
    join contacts c on c.id = sc.contact_id
    where sc.server_id = p_server_id
      and sc.status = 'granted'
      and c.auth_user_id = auth.uid()
  );
$$;

-- 3b. server_contacts row — left unchanged. An artist needs to see
--     their own pending row for the future "/listen/pending"
--     screen (Phase 3.8.5+), and it's safe because the function
--     only matches rows whose contact is the caller.

-- 3c. Beat read — must walk through a 'granted' membership.
create or replace function public.artist_can_read_beat(p_beat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from server_beats sb
    join server_contacts sc on sc.server_id = sb.server_id
    join contacts c on c.id = sc.contact_id
    where sb.beat_id = p_beat_id
      and sc.status = 'granted'
      and c.auth_user_id = auth.uid()
  );
$$;

-- 3d. Likes / listens write gate — same status check so a pending
--     artist can't pre-spam reactions on a server they haven't
--     been approved on.
create or replace function public.artist_owns_contact_server(
  p_contact_id uuid,
  p_server_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from contacts c
    join server_contacts sc on sc.contact_id = c.id
    where c.id = p_contact_id
      and c.auth_user_id = auth.uid()
      and sc.server_id = p_server_id
      and sc.status = 'granted'
  );
$$;

-- ============================================================
-- 4. claim_server_access — branch on visibility, post a
--    'access_request' notification on new pending rows.
-- ============================================================
create or replace function public.claim_server_access(p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_server_id uuid;
  v_owner_id uuid;
  v_visibility text;
  v_server_name text;
  v_contact_id uuid;
  v_status text;
  v_inserted_member integer;
  v_producer_user_id uuid;
  v_artist_label text;
begin
  if v_uid is null or coalesce(v_email, '') = '' then
    return null;
  end if;

  select id, owner_id, visibility, name
    into v_server_id, v_owner_id, v_visibility, v_server_name
  from public.servers
  where slug = p_slug
  limit 1;

  if v_server_id is null then
    return null;
  end if;

  v_status := case
    when v_visibility = 'private' then 'pending'
    else 'granted'
  end;

  -- Upsert the contact. Producer may have pre-added by email
  -- (auth_user_id null); new contacts come in here too.
  insert into public.contacts
    (owner_id, email, auth_user_id, last_active_at)
  values
    (v_owner_id, v_email, v_uid, now())
  on conflict (owner_id, email) do update set
    auth_user_id = coalesce(
      public.contacts.auth_user_id,
      excluded.auth_user_id
    ),
    last_active_at = now()
  returning id into v_contact_id;

  -- Insert membership. status branches on visibility; granted_at
  -- only set when status='granted'.
  insert into public.server_contacts
    (server_id, contact_id, status, granted_at, requested_at)
  values (
    v_server_id,
    v_contact_id,
    v_status,
    case when v_status = 'granted' then now() else null end,
    now()
  )
  on conflict (server_id, contact_id) do nothing;

  get diagnostics v_inserted_member = row_count;

  -- Producer notification — ONLY on a freshly-inserted pending
  -- row. Skips:
  --   - public servers (auto-grant, producer didn't gate them)
  --   - repeat clicks on the same gate (no new row → no spam)
  --   - re-clicks after a previous approve (row exists 'granted')
  if v_inserted_member > 0 and v_status = 'pending' then
    select user_id into v_producer_user_id
    from public.profiles
    where id = v_owner_id;

    if v_producer_user_id is not null then
      -- Artist display label: prefer artist_profiles.display_name,
      -- fall back to email-local-part so the row never reads as
      -- "null wants access".
      select ap.display_name into v_artist_label
      from public.artist_profiles ap
      where ap.user_id = v_uid
      limit 1;
      v_artist_label := coalesce(
        v_artist_label,
        split_part(v_email, '@', 1)
      );

      insert into public.notifications
        (recipient_user_id, kind, actor_name, actor_seed, body, server_id)
      values (
        v_producer_user_id,
        'access_request',
        v_artist_label,
        v_artist_label,
        format('wants access to %s.', v_server_name),
        v_server_id
      );
    end if;
  end if;

  return v_contact_id;
end;
$$;

revoke all on function public.claim_server_access(text) from public;
grant execute on function public.claim_server_access(text) to authenticated;

comment on function public.claim_server_access is
  'Phase 3.8.5: idempotent claim from /s/[slug]. Public → granted instantly; private → pending + producer notification. Returns contact_id or null when unauthed / slug missing.';

notify pgrst, 'reload schema';
