-- Wavloops V3 — migration #41.
-- Landing banner — singleton config row read anonymously by the
-- landing page on every render, written only by the service-
-- role client from the admin surface.
--
-- The boolean PK + check constraint enforces a *single* row:
-- any insert other than (true) fails, any second (true) row
-- collides on the PK. So the admin form's 'save' is always an
-- UPDATE.

create table public.landing_banner (
  id boolean primary key default true check (id = true),
  is_active boolean not null default false,
  message text not null default '',
  cta_label text,
  cta_href text,
  variant text not null default 'info' check (variant in ('info', 'promo', 'warning')),
  updated_at timestamptz not null default now()
);

-- Seed the singleton.
insert into public.landing_banner (id) values (true);

-- Touch updated_at on every UPDATE.
create or replace function public.landing_banner_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger landing_banner_touch
  before update on public.landing_banner
  for each row execute function public.landing_banner_touch_updated_at();

alter table public.landing_banner enable row level security;

-- Public read so the landing renders the banner anonymously.
create policy "landing_banner_public_read"
on public.landing_banner for select
to public
using (true);

-- Writes only via service_role (the admin server action uses
-- the admin client). Revoke unnecessary writes from anon and
-- authenticated for defense in depth.
revoke all on table public.landing_banner from anon, authenticated;
grant select on table public.landing_banner to anon, authenticated;

notify pgrst, 'reload schema';
