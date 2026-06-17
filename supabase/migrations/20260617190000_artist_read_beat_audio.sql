-- Wavloops V3 — migration #17.
-- Let an authed artist read (and mint signed URLs for) the beat-
-- audio files they have access to via contacts → server_contacts.
--
-- Why this lands now
-- ──────────────────
-- /listen/[slug] tries to render a player on every beat in the
-- pack via createSignedUrls("beat-audio", paths, 3600). That call
-- runs under the artist's JWT and is gated by storage.objects RLS.
-- Today only `beat_audio_select_own` exists — folder-name match
-- against auth.uid() — which is the PRODUCER. The artist hits a
-- silent permission denial, the signed URL never comes back, and
-- the PlayerDock loads metadata but plays nothing.
--
-- The fix is the same shape as migration #16 — an artist-read
-- helper function inside a SECURITY DEFINER body to avoid RLS
-- cycles on the joined tables, plumbed into a new policy on
-- storage.objects.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.

-- ============================================================
-- 1. SECURITY DEFINER helper — true iff the current user is an
--    artist with access to any beat whose audio_url equals
--    p_path.
-- ============================================================
create or replace function public.artist_can_read_beat_audio(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from beats b
    join server_beats sb on sb.beat_id = b.id
    join server_contacts sc on sc.server_id = sb.server_id
    join contacts c on c.id = sc.contact_id
    where b.audio_url = p_path
      and c.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.artist_can_read_beat_audio(text) from public;
grant execute on function public.artist_can_read_beat_audio(text) to authenticated;

-- ============================================================
-- 2. Storage policy — artist can SELECT (which is what
--    createSignedUrl checks under the hood) any beat-audio
--    object whose path the helper greenlights. Coexists with
--    beat_audio_select_own — multiple policies OR-merge on
--    select, so the producer's owner read keeps working
--    unchanged.
-- ============================================================
drop policy if exists beat_audio_artist_read on storage.objects;
create policy beat_audio_artist_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'beat-audio'
    and public.artist_can_read_beat_audio(storage.objects.name)
  );

notify pgrst, 'reload schema';
