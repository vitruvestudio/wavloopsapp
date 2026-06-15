-- Wavloops V3 — migration #11.
-- Extend the artist gate RPC so it also returns the producer's
-- certifications + placements. Same SECURITY DEFINER + slug-input
-- model as migration #10 — no enumeration surface added.
--
-- HOW TO APPLY
-- ─────────────
-- Supabase Dashboard → SQL Editor → paste this file → Run.
-- Idempotent (create or replace). Drops the existing function
-- first because the return shape changed — Postgres won't replace
-- a function in place when the OUT signature differs.

drop function if exists public.get_server_for_gate(text);

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
