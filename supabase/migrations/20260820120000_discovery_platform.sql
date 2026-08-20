-- Additive discovery-platform schema: editorial content, coupon trust,
-- store/category SEO fields, subscriber interests and first-party events.
-- Does not drop or rewrite existing production tables.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'article_type') then
    create type public.article_type as enum ('best_in_test', 'review', 'guide');
  end if;

  if not exists (select 1 from pg_type where typname = 'methodology_type') then
    create type public.methodology_type as enum (
      'tested_by_us',
      'editorial_evaluation',
      'compared_from_sources'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'discovery_event_type') then
    create type public.discovery_event_type as enum (
      'deal_view',
      'coupon_copy',
      'affiliate_click',
      'newsletter_signup',
      'search',
      'coupon_worked',
      'coupon_failed'
    );
  end if;
end $$;

alter table public.stores
  add column if not exists is_featured boolean not null default false,
  add column if not exists affiliate_url text,
  add column if not exists saving_tips text,
  add column if not exists seo_intro text;

alter table public.categories
  add column if not exists seo_intro text;

alter table public.offers
  add column if not exists last_verified_at timestamptz,
  add column if not exists is_sponsored boolean not null default false,
  add column if not exists original_price numeric(10, 2),
  add column if not exists current_price numeric(10, 2);

alter table public.deal_subscribers
  add column if not exists interests text[] not null default '{}';

-- Imported offers were confirmed live by the affiliate feed, so last_synced_at
-- is a real verification signal. Nothing else is backfilled: updated_at only
-- says when a record was edited, never that anyone checked the offer.
update public.offers
set last_verified_at = last_synced_at
where last_verified_at is null
  and last_synced_at is not null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  image_url text,
  product_url text,
  current_price numeric(10, 2),
  specifications jsonb not null default '{}'::jsonb,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  article_type public.article_type not null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  category_id uuid references public.categories(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  author_name text not null default 'braerbjudanden.se',
  methodology public.methodology_type not null default 'editorial_evaluation',
  featured_image_url text,
  editorial_score numeric(3, 1),
  verdict text,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  best_for text,
  not_best_for text,
  compared_products jsonb not null default '[]'::jsonb,
  is_sponsored boolean not null default false,
  status public.offer_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_editorial_score_range check (
    editorial_score is null or (editorial_score >= 0 and editorial_score <= 10)
  )
);

create table if not exists public.coupon_feedback (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  worked boolean not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  constraint coupon_feedback_offer_ip_unique unique (offer_id, ip_hash)
);

create table if not exists public.discovery_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.discovery_event_type not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  occurred_at timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

create index if not exists stores_featured_idx on public.stores (is_featured desc, name asc)
  where status = 'active';
create index if not exists products_status_slug_idx on public.products (status, slug);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists articles_public_idx on public.articles (article_type, published_at desc)
  where status = 'published';
create index if not exists articles_category_id_idx on public.articles (category_id);
create index if not exists articles_store_id_idx on public.articles (store_id);
create index if not exists coupon_feedback_offer_id_idx on public.coupon_feedback (offer_id);
create index if not exists discovery_events_type_occurred_idx
  on public.discovery_events (event_type, occurred_at desc);
create index if not exists discovery_events_entity_idx
  on public.discovery_events (entity_type, entity_id, occurred_at desc);

alter table public.products enable row level security;
alter table public.articles enable row level security;
alter table public.coupon_feedback enable row level security;
alter table public.discovery_events enable row level security;

drop policy if exists "Active products are public" on public.products;
create policy "Active products are public"
on public.products
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public"
on public.articles
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

insert into public.categories (name, slug, description, seo_intro, status)
values
  (
    'Elektronik',
    'elektronik',
    'Rabatter på teknik, hörlurar, datorer och hemelektronik.',
    'Hitta aktuella erbjudanden på elektronik från svenska butiker. Vi samlar rabattkoder och kampanjer så att du kan jämföra utan att jaga runt.',
    'active'
  ),
  (
    'Mode',
    'mode',
    'Kläder, skor och accessoarer till bättre pris.',
    'Modeerbjudanden och rabattkoder från kända och mindre butiker. Fokus på aktuella kampanjer, inte utgångna koder.',
    'active'
  ),
  (
    'Hem & inredning',
    'hem-inredning',
    'Möbler, kök och inredning för hemmet.',
    'Erbjudanden för hem och inredning – från möbler till kökstillbehör – samlade på ett ställe.',
    'active'
  ),
  (
    'Skönhet',
    'skonhet',
    'Hudvård, smink och doft med aktuell rabatt.',
    'Skönhetserbjudanden och rabattkoder. Vi visar bara koder och kampanjer som fortfarande är aktiva.',
    'active'
  ),
  (
    'Hälsa',
    'halsa',
    'Hälsa, egenvård och välmående.',
    'Aktuella erbjudanden inom hälsa. Jämför butiker och koder innan du köper.',
    'active'
  ),
  (
    'Träning & sport',
    'traning-sport',
    'Träningskläder, utrustning och sportbutiker.',
    'Sport- och träningserbjudanden från svenska butiker, inklusive rabattkoder när de finns.',
    'active'
  ),
  (
    'Barn & familj',
    'barn-familj',
    'Erbjudanden för barn, bebis och familjeliv.',
    'Hitta rabatter för barn och familj utan att behöva hålla koll på dussintals nyhetsbrev.',
    'active'
  ),
  (
    'Resor',
    'resor',
    'Hotell, flyg, upplevelser och resebokningar.',
    'Reseerbjudanden och koder när de faktiskt gäller. Alltid med villkor synliga.',
    'active'
  ),
  (
    'Mat',
    'mat',
    'Matkassar, restauranger och dagligvaror.',
    'Matrelaterade erbjudanden och rabattkoder från svenska aktörer.',
    'active'
  ),
  (
    'Tjänster',
    'tjanster',
    'Streaming, försäkring, abonnemang och andra tjänster.',
    'Rabattkoder och kampanjer på digitala och praktiska tjänster.',
    'active'
  )
on conflict (slug) do nothing;
