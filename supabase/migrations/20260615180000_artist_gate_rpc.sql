-- Wavloops V3 — migration #10.
-- Public RPC that returns just enough metadata to render an artist
-- gate page for one specific server.
--
-- Why an RPC and not a relaxed RLS policy on `servers`:
--   - The page lives at /s/<slug> and is meant to act like a Discord
--     invite link: anyone with the slug sees the gate, but nobody can
--     ENUMERATE every server in the producer's account.
--   - A plain "for select using (true)" on `servers` would let any
--     anonymous PostgREST request list every server (no slug needed)
--     just by hitting /rest/v1/servers — undesirable.
--   - This function takes the slug as input and only ever returns
--     one row. It runs SECURITY DEFINER so it can read past the
--     existing visibility=public RLS policy, but it CAN'T be used to
--     list everything because the input is a single slug.
--
-- Returned shape covers everything the gate page renders:
--   - server identity + artwork settings (so the background can be
--     auto-mosaic / colour / uploaded image)
--   - producer identity (avatar, name, handle, bio, socials)
--   - up to 4 beat covers (for the auto-mosaic background)
--   - the server's visibility (public / private) so the form copy
--     can adapt ("instant access" vs "manual approval")
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.
-- Idempotent (create or replace).

create or replace function public.get_server_for_gate(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  style_text text,
  artwork_mode text,
  accent_hue int,
  artwork_image_url text,
  visibility text,
  beats_count int,
  producer_handle text,
  producer_name text,
  producer_avatar_url text,
  producer_bio text,
  producer_socials jsonb,
  beat_covers jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.slug,
    s.description,
    s.style_text,
    s.artwork_mode,
    s.accent_hue,
    s.artwork_image_url,
    s.visibility::text,
    coalesce(
      (select count(*)::int from public.server_beats sb where sb.server_id = s.id),
      0
    ) as beats_count,
    p.handle as producer_handle,
    p.name as producer_name,
    p.avatar_url as producer_avatar_url,
    p.bio as producer_bio,
    p.socials as producer_socials,
    coalesce(
      (select jsonb_agg(x.cover order by x.position)
       from (
         select
           jsonb_build_object(
             'artwork_url', b.artwork_url,
             'wave_seed', b.wave_seed
           ) as cover,
           sb.position
         from public.server_beats sb
         join public.beats b on b.id = sb.beat_id
         where sb.server_id = s.id
         order by sb.position
         limit 4
       ) x),
      '[]'::jsonb
    ) as beat_covers
  from public.servers s
  join public.profiles p on p.id = s.owner_id
  where s.slug = p_slug;
$$;

grant execute on function public.get_server_for_gate(text) to anon, authenticated;

notify pgrst, 'reload schema';
