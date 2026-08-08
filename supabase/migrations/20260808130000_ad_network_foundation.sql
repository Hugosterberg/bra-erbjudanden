-- Ad Network: Allow advertisers to buy placements on braerbjudanden.se

-- Advertiser accounts
create table if not exists public.advertiser_accounts (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_email text not null unique,
  contact_phone text,
  website_url text,
  country text default 'SE',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended', 'inactive')),
  verification_token text unique,
  verified_at timestamptz,
  payment_method text check (payment_method in ('stripe', 'bank_transfer', 'invoice')),
  stripe_customer_id text,
  api_key text unique,
  api_secret text,
  monthly_budget_sek numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advertiser_accounts_status_idx
  on public.advertiser_accounts (status);

create index if not exists advertiser_accounts_api_key_idx
  on public.advertiser_accounts (api_key);

-- Ad campaigns (groups of ads)
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_accounts(id) on delete cascade,
  name text not null,
  description text,
  target_url text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'rejected')),
  campaign_type text not null check (campaign_type in ('banner', 'featured_offer', 'native', 'sidebar')),
  pricing_model text not null check (pricing_model in ('cpm', 'cpc', 'daily_flat')),
  bid_amount numeric(10, 4) not null check (bid_amount > 0),
  currency text default 'SEK',
  daily_budget_sek numeric(10, 2),
  total_budget_sek numeric(12, 2),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  target_categories text[] default '{}',
  target_regions text[] default '{}',
  auto_renew boolean default false,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_advertiser_idx
  on public.ad_campaigns (advertiser_id);

create index if not exists ad_campaigns_status_idx
  on public.ad_campaigns (status, starts_at desc);

create index if not exists ad_campaigns_active_idx
  on public.ad_campaigns (status)
  where status = 'active';

-- Ad creatives (visual assets)
create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  name text not null,
  creative_type text not null check (creative_type in ('image', 'text', 'video', 'html')),
  image_url text,
  image_alt_text text,
  headline text,
  body_text text,
  cta_text text default 'Besök',
  html_content text,
  video_url text,
  width integer,
  height integer,
  file_size integer,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_creatives_campaign_idx
  on public.ad_creatives (campaign_id);

create index if not exists ad_creatives_status_idx
  on public.ad_creatives (status);

-- Ad placements (where ads appear)
create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  placement_type text not null check (placement_type in ('homepage_banner', 'homepage_sidebar', 'category_hero', 'offer_card_sponsor', 'sidebar_vertical', 'footer_banner')),
  position_priority integer not null default 10,
  width integer,
  height integer,
  max_daily_impressions integer,
  supported_formats text[] not null default '{"image", "text", "html"}',
  base_cpm_sek numeric(10, 2),
  min_bid_sek numeric(10, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_placements_active_idx
  on public.ad_placements (active);

-- Ad impressions (when ads are shown)
create table if not exists public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  placement_id uuid not null references public.ad_placements(id) on delete set null,
  user_id text,
  session_id text,
  ip_hash text,
  user_agent text,
  referrer text,
  page_url text,
  recorded_at timestamptz not null default now()
);

create index if not exists ad_impressions_campaign_idx
  on public.ad_impressions (campaign_id);

create index if not exists ad_impressions_recorded_idx
  on public.ad_impressions (recorded_at desc);

create index if not exists ad_impressions_campaign_recorded_idx
  on public.ad_impressions (campaign_id, recorded_at desc);

-- Ad clicks (when users click ads)
create table if not exists public.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  impression_id uuid references public.ad_impressions(id) on delete set null,
  user_id text,
  session_id text,
  ip_hash text,
  recorded_at timestamptz not null default now()
);

create index if not exists ad_clicks_campaign_idx
  on public.ad_clicks (campaign_id);

create index if not exists ad_clicks_recorded_idx
  on public.ad_clicks (recorded_at desc);

-- Daily ad metrics (aggregated)
create table if not exists public.ad_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  placement_id uuid references public.ad_placements(id) on delete set null,
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  spend_sek numeric(10, 2) not null default 0 check (spend_sek >= 0),
  ctr numeric(5, 2),
  cpc_sek numeric(10, 4),
  unique (date, campaign_id, placement_id)
);

create index if not exists ad_metrics_daily_campaign_idx
  on public.ad_metrics_daily (campaign_id, date desc);

create index if not exists ad_metrics_daily_date_idx
  on public.ad_metrics_daily (date desc);

-- Advertiser payouts
create table if not exists public.advertiser_payouts (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_accounts(id) on delete cascade,
  payout_period_start date not null,
  payout_period_end date not null,
  total_impressions integer not null default 0,
  total_clicks integer not null default 0,
  total_spend_sek numeric(12, 2) not null,
  platform_fee_sek numeric(12, 2),
  payout_amount_sek numeric(12, 2),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists advertiser_payouts_advertiser_idx
  on public.advertiser_payouts (advertiser_id);

create index if not exists advertiser_payouts_status_idx
  on public.advertiser_payouts (status);

-- Advertiser API usage log
create table if not exists public.advertiser_api_logs (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_accounts(id) on delete cascade,
  endpoint text not null,
  method text not null,
  status_code integer,
  error_message text,
  request_body text,
  ip_address text,
  logged_at timestamptz not null default now()
);

create index if not exists advertiser_api_logs_advertiser_idx
  on public.advertiser_api_logs (advertiser_id);

create index if not exists advertiser_api_logs_logged_idx
  on public.advertiser_api_logs (logged_at desc);

-- Ad network settings (global config)
create table if not exists public.ad_network_settings (
  id uuid primary key default gen_random_uuid(),
  platform_fee_percentage numeric(5, 2) default 20,
  min_campaign_budget_sek numeric(10, 2) default 500,
  max_daily_impressions integer default 100000,
  approval_required boolean default true,
  auto_approve_by_score boolean default false,
  approval_score_threshold numeric(3, 1),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.advertiser_accounts enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_placements enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;
alter table public.ad_metrics_daily enable row level security;
alter table public.advertiser_payouts enable row level security;
alter table public.advertiser_api_logs enable row level security;
alter table public.ad_network_settings enable row level security;

-- RLS Policies: public can view active ads only
create policy "public_view_active_campaigns"
  on public.ad_campaigns for select
  using (status = 'active' and starts_at <= now() and ends_at > now());

-- RLS Policies: advertiser can see own data
create policy "advertiser_view_own_account"
  on public.advertiser_accounts for select
  using (false);

create policy "advertiser_view_own_campaigns"
  on public.ad_campaigns for select
  using (false);

-- RLS Policies: admin only (via service role)
create policy "admin_manage_advertiser_accounts"
  on public.advertiser_accounts for all
  using (false);

create policy "admin_manage_ad_campaigns"
  on public.ad_campaigns for all
  using (false);
