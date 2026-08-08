-- Monetization foundation: revenue tracking, sponsorships, and analytics

-- Revenue tracking per network and offer
create table if not exists public.affiliate_revenue_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  affiliate_network public.affiliate_network not null,
  event_type text not null check (event_type in ('impression', 'click', 'conversion')),
  revenue_usd numeric(10, 4) not null default 0 check (revenue_usd >= 0),
  revenue_sek numeric(10, 2),
  currency text default 'USD',
  external_transaction_id text,
  recorded_at timestamptz not null default now(),
  user_agent text,
  referrer text,
  ip_hash text
);

create index if not exists affiliate_revenue_events_offer_idx
  on public.affiliate_revenue_events (offer_id);

create index if not exists affiliate_revenue_events_network_idx
  on public.affiliate_revenue_events (affiliate_network);

create index if not exists affiliate_revenue_events_recorded_idx
  on public.affiliate_revenue_events (recorded_at desc);

create index if not exists affiliate_revenue_events_type_recorded_idx
  on public.affiliate_revenue_events (event_type, recorded_at desc);

-- Daily aggregated revenue metrics
create table if not exists public.affiliate_revenue_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  affiliate_network public.affiliate_network not null,
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  conversions integer not null default 0 check (conversions >= 0),
  revenue_usd numeric(12, 2) not null default 0 check (revenue_usd >= 0),
  average_cpc numeric(10, 4),
  average_cpm numeric(10, 4),
  created_at timestamptz not null default now(),
  unique (date, affiliate_network)
);

create index if not exists affiliate_revenue_daily_date_idx
  on public.affiliate_revenue_daily (date desc);

create index if not exists affiliate_revenue_daily_network_idx
  on public.affiliate_revenue_daily (affiliate_network, date desc);

-- Sponsorship / Premium placement offers
create table if not exists public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  sponsor_name text not null,
  sponsor_website_url text,
  pricing_model text not null check (pricing_model in ('cpc', 'cpm', 'flat_daily')),
  amount numeric(10, 2) not null check (amount > 0),
  currency text default 'SEK',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  reserved_position integer check (reserved_position > 0 and reserved_position <= 20),
  impressions_goal integer,
  clicks_goal integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sponsorships_offer_idx
  on public.sponsorships (offer_id);

create index if not exists sponsorships_status_idx
  on public.sponsorships (status, starts_at desc);

create index if not exists sponsorships_active_idx
  on public.sponsorships (status)
  where status = 'active';

-- Sponsorship performance tracking
create table if not exists public.sponsorship_events (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references public.sponsorships(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  recorded_at timestamptz not null default now()
);

create index if not exists sponsorship_events_sponsorship_idx
  on public.sponsorship_events (sponsorship_id);

create index if not exists sponsorship_events_recorded_idx
  on public.sponsorship_events (recorded_at desc);

-- Affiliate disclosure settings
create table if not exists public.affiliate_disclosure_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'braerbjudanden.se',
  disclosure_text text,
  privacy_policy_url text,
  affiliate_policy_url text,
  faq_url text,
  show_disclosure_badge boolean not null default true,
  show_network_attribution boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Insert default disclosure settings
insert into public.affiliate_disclosure_settings (site_name)
  values ('braerbjudanden.se')
  on conflict (site_name) do nothing;

-- Revenue configuration per network
create table if not exists public.affiliate_network_config (
  id uuid primary key default gen_random_uuid(),
  affiliate_network public.affiliate_network not null unique,
  commission_percentage numeric(5, 2),
  min_revenue_threshold numeric(10, 2),
  payout_frequency text default 'monthly',
  last_payout_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for new tables
alter table public.affiliate_revenue_events enable row level security;
alter table public.affiliate_revenue_daily enable row level security;
alter table public.sponsorships enable row level security;
alter table public.sponsorship_events enable row level security;
alter table public.affiliate_disclosure_settings enable row level security;
alter table public.affiliate_network_config enable row level security;

-- RLS policies: public can view affiliate_revenue_events (anonymized)
create policy "allow_public_view_revenue_events"
  on public.affiliate_revenue_events
  for select
  using (true);

-- RLS policies: public can view sponsorships
create policy "allow_public_view_active_sponsorships"
  on public.sponsorships
  for select
  using (status = 'active' and ends_at > now());

-- RLS policies: public can view daily revenue (aggregated)
create policy "allow_public_view_daily_revenue"
  on public.affiliate_revenue_daily
  for select
  using (true);

-- RLS policies: only admin can write (via service role)
create policy "admin_manage_sponsorships"
  on public.sponsorships
  for all
  using (false)
  with check (false);

create policy "admin_manage_revenue_config"
  on public.affiliate_network_config
  for all
  using (false)
  with check (false);

create policy "admin_view_all_revenue"
  on public.affiliate_revenue_events
  for select
  using (false);

create policy "admin_view_all_disclosures"
  on public.affiliate_disclosure_settings
  for select
  using (false);
