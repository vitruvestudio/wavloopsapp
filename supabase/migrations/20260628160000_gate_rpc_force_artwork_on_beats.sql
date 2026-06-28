-- ============================================================
-- get_server_for_gate — honor the server's force_artwork_on_beats
-- flag in the gate page mosaic.
--
-- Per Theo's spec: the only surface where beat artwork should
-- NEVER inherit the server cover is the producer's /library.
-- Everywhere a beat is shown INSIDE a specific server — artist
-- /listen/[slug], producer /servers/[slug], AND the public gate
-- page /s/[slug] — the override should apply.
--
-- The gate page renders a 4-cover mosaic from the function's
-- `beat_covers` jsonb. We swap each cover's artwork_url when:
--   - s.force_artwork_on_beats is true, AND
--   - s.artwork_image_url is set
-- Otherwise the original b.artwork_url stays. Return shape is
-- unchanged so the page.tsx contract holds.
-- ============================================================

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
  producer_certifications text[],
  producer_placements jsonb,
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
    coalesce(p.certifications, array[]::text[]) as producer_certifications,
    coalesce(p.placements, '[]'::jsonb) as producer_placements,
    coalesce(
      (select jsonb_agg(x.cover order by x.position)
       from (
         select
           jsonb_build_object(
             'artwork_url',
             case
               when s.force_artwork_on_beats
                 and s.artwork_image_url is not null
                 then s.artwork_image_url
               else b.artwork_url
             end,
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
