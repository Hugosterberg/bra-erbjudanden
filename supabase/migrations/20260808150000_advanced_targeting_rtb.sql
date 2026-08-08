-- Advanced targeting and real-time bidding system

-- Targeting rules (geo, device, time, etc)
create table if not exists public.ad_targeting_rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  rule_type text not null check (rule_type in ('geo', 'device', 'time', 'weather', 'language', 'custom')),
  rule_condition jsonb not null,  -- e.g., {"country": "SE", "region": "stockholm"}
  bid_multiplier numeric(3, 2) default 1.0,  -- 0.5 = 50% lower bid, 1.5 = 50% higher
  active boolean default true,
  created_at timestamptz not null default now()
);

create index if not exists ad_targeting_rules_campaign_idx
  on public.ad_targeting_rules (campaign_id);

-- Real-time bidding auction history
create table if not exists public.rtb_auctions (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  session_id text not null,
  user_context jsonb not null,  -- { geo, device, time, referrer, etc }
  auction_winners text[] not null default '{}',  -- campaign IDs
  highest_bid numeric(10, 4),
  second_highest_bid numeric(10, 4),
  winning_campaign_id uuid references public.ad_campaigns(id) on delete set null,
  winning_creative_id uuid references public.ad_creatives(id) on delete set null,
  auction_time_ms integer,  -- How long auction took
  auction_at timestamptz not null default now()
);

create index if not exists rtb_auctions_placement_idx
  on public.rtb_auctions (placement_id);

create index if not exists rtb_auctions_auction_at_idx
  on public.rtb_auctions (auction_at desc);

-- Dynamic floor prices based on demand
create table if not exists public.placement_floor_prices (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  date date not null,
  hour integer check (hour >= 0 and hour < 24),  -- Hourly floor price
  base_floor_sek numeric(10, 4),
  dynamic_floor_sek numeric(10, 4),  -- Adjusted based on demand
  demand_index numeric(3, 2),  -- 0.5 = low demand, 2.0 = high demand
  impressions_delivered integer default 0,
  capacity_used_percent numeric(5, 2),
  updated_at timestamptz not null default now(),
  unique (placement_id, date, hour)
);

-- Campaign budget pacing (spread budget throughout day)
create table if not exists public.campaign_budget_pacing (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  date date not null,
  budget_allocated_sek numeric(10, 2),
  budget_spent_sek numeric(10, 2) default 0,
  impressions_target integer,
  impressions_delivered integer default 0,
  pace_multiplier numeric(3, 2),  -- 1.0 = normal, 0.5 = slow down, 1.5 = speed up
  updated_at timestamptz not null default now(),
  unique (campaign_id, date)
);

-- Audience segments for targeting
create table if not exists public.audience_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  segment_type text not null check (segment_type in ('lookalike', 'retargeting', 'behavioral', 'demographic')),
  rules jsonb not null,  -- Complex targeting rules
  size_estimate integer,  -- Estimated audience size
  active boolean default true,
  created_at timestamptz not null default now()
);

-- Map campaigns to audience segments
create table if not exists public.campaign_audience_segments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  segment_id uuid not null references public.audience_segments(id) on delete cascade,
  bid_adjustment numeric(3, 2) default 1.0,  -- Bid multiplier for this segment
  unique (campaign_id, segment_id)
);

-- Placement performance scoring
create table if not exists public.placement_performance_score (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  date date not null,
  viewability_score numeric(3, 2),  -- 0-1: how often ads are actually viewed
  click_through_rate numeric(5, 2),
  average_ctr numeric(5, 2),
  brand_safety_score numeric(3, 2),  -- 0-1: how safe for brand advertisers
  fraud_rate numeric(5, 2),
  overall_quality_score numeric(3, 2),  -- 0-1 composite score
  unique (placement_id, date)
);

-- Publisher (braerbjudanden.se) revenue summary
create table if not exists public.publisher_revenue_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  affiliate_revenue_sek numeric(12, 2) default 0,
  ad_network_revenue_sek numeric(12, 2) default 0,
  total_revenue_sek numeric(12, 2) default 0,
  affiliate_clicks integer default 0,
  ad_impressions bigint default 0,
  ad_clicks integer default 0,
  created_at timestamptz not null default now()
);

-- Publisher (site) performance metrics
create table if not exists public.publisher_performance_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  total_visitors integer,
  unique_visitors integer,
  page_views bigint,
  avg_session_duration_sec integer,
  bounce_rate numeric(5, 2),
  conversion_rate numeric(5, 2),
  created_at timestamptz not null default now()
);

-- Compliance & brand safety scores
create table if not exists public.ad_compliance_review (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  reviewer_id text,  -- Admin who reviewed
  compliance_score numeric(3, 2),  -- 0-1: compliance with rules
  brand_safety_score numeric(3, 2),  -- 0-1: appropriate for most brands
  content_flags text[] default '{}',  -- e.g., ["adult_content", "violence"]
  status text not null default 'approved' check (status in ('approved', 'flagged', 'rejected')),
  notes text,
  updated_at timestamptz not null default now()
);

-- Marketplace listings (advertisers see available placements)
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  date_from date not null,
  date_to date not null,
  available_impressions integer,
  sold_impressions integer default 0,
  base_price_sek numeric(10, 4),
  current_floor_sek numeric(10, 4),
  demand_level text default 'low' check (demand_level in ('low', 'medium', 'high', 'very_high')),
  status text default 'available' check (status in ('available', 'sold_out', 'reserved')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ad_targeting_rules enable row level security;
alter table public.rtb_auctions enable row level security;
alter table public.placement_floor_prices enable row level security;
alter table public.campaign_budget_pacing enable row level security;
alter table public.audience_segments enable row level security;
alter table public.campaign_audience_segments enable row level security;
alter table public.placement_performance_score enable row level security;
alter table public.publisher_revenue_daily enable row level security;
alter table public.publisher_performance_daily enable row level security;
alter table public.ad_compliance_review enable row level security;
alter table public.marketplace_listings enable row level security;
