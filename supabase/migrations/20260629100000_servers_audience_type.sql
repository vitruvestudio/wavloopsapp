-- ============================================================
-- servers.audience_type
--
-- Marks who a server is FOR — drives the producer-nurture email
-- sequence (only contacts who joined producer-audience servers
-- receive it).
--
-- Two values, binary:
--   'producers' — loops / samples for other producers to chop
--                 + flip. The nurture sequence educates these
--                 contacts on how to use Wavloops themselves.
--   'artists'   — finished beats for rappers / singers to topline
--                 on. NO nurture sequence (different audience,
--                 different copy needed in a later phase).
--
-- Default 'artists' is the SAFE default: a misclassified server
-- defaults to NOT spamming producer-onboarding emails to rappers.
-- Worst case is a missed funnel hit, never wrong-targeting.
--
-- Like every previous column addition (downloads_allowed,
-- force_artwork_on_beats), the servers_with_stats view's `s.*`
-- was frozen at create-time. DROP + CREATE so the new column
-- becomes visible through the view.
-- ============================================================

alter table public.servers
  add column if not exists audience_type text
  not null default 'artists'
  check (audience_type in ('producers', 'artists'));

comment on column public.servers.audience_type is
  'Persona this server targets. ''producers'' = loops for other producers to chop/flip; ''artists'' = beats for rappers/singers to topline. Drives nurture email sequence routing.';

drop view if exists public.servers_with_stats;

create view public.servers_with_stats
with (security_invoker = true) as
select
  s.*,
  coalesce(b.count, 0)::int as beats_count,
  coalesce(c.count, 0)::int as contacts_count,
  coalesce(l.count, 0)::int as plays_count
from public.servers s
left join lateral (
  select count(*)::int as count
  from public.server_beats sb
  where sb.server_id = s.id
) b on true
left join lateral (
  select count(*)::int as count
  from public.server_contacts sc
  where sc.server_id = s.id
) c on true
left join lateral (
  select count(*)::int as count
  from public.listens ls
  where ls.server_id = s.id
) l on true;

grant select on public.servers_with_stats to authenticated, anon;

notify pgrst, 'reload schema';
