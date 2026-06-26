create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type public.offer_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percentage', 'fixed_amount');
  end if;

  if not exists (select 1 from pg_type where typname = 'entity_status') then
    create type public.entity_status as enum ('active', 'inactive', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('admin');
  end if;
end $$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.admin_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website_url text,
  logo_url text,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  store_id uuid not null references public.stores(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  discount_type public.discount_type not null,
  discount_value numeric(10, 2) not null,
  discount_code text,
  affiliate_url text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.offer_status not null default 'draft',
  rank_position integer not null default 100,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_discount_value_positive check (discount_value > 0),
  constraint offers_rank_position_positive check (rank_position >= 0),
  constraint offers_dates_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  ip_hash text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create index if not exists stores_status_slug_idx on public.stores (status, slug);
create index if not exists categories_status_slug_idx on public.categories (status, slug);
create index if not exists offers_store_id_idx on public.offers (store_id);
create index if not exists offers_category_id_idx on public.offers (category_id);
create index if not exists offers_public_rank_idx on public.offers (is_featured desc, rank_position asc, updated_at desc)
  where status = 'published';
create index if not exists offers_public_store_rank_idx on public.offers (store_id, rank_position asc, updated_at desc)
  where status = 'published';
create index if not exists offers_public_category_rank_idx on public.offers (category_id, rank_position asc, updated_at desc)
  where status = 'published';
create index if not exists click_events_offer_clicked_at_idx on public.click_events (offer_id, clicked_at desc);
create index if not exists click_events_store_clicked_at_idx on public.click_events (store_id, clicked_at desc);
create index if not exists admin_profiles_role_idx on public.admin_profiles (role);

alter table public.admin_profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.offers enable row level security;
alter table public.click_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
create policy "Admins can manage admin profiles"
on public.admin_profiles
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can manage stores" on public.stores;
create policy "Admins can manage stores"
on public.stores
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Active stores are public" on public.stores;
create policy "Active stores are public"
on public.stores
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Active categories are public" on public.categories;
create policy "Active categories are public"
on public.categories
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Admins can manage offers" on public.offers;
create policy "Admins can manage offers"
on public.offers
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Published active offers are public" on public.offers;
create policy "Published active offers are public"
on public.offers
for select
to anon, authenticated
using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "Admins can read click events" on public.click_events;
create policy "Admins can read click events"
on public.click_events
for select
to authenticated
using ((select public.is_admin()));
