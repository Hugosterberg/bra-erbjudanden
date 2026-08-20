-- Advanced Monetization Pro: Header Bidding, Native Ads, Sponsored Content, Revenue Maximization

-- Ad networks for programmatic display
create table if not exists public.ad_networks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('display', 'native', 'video', 'programmatic')),
  api_key text,
  revenue_share numeric(5, 2) default 20,  -- Our cut %
  status text default 'active' check (status in ('active', 'testing', 'paused')),
  notes text,
  created_at timestamptz not null default now()
);

-- Header bidding configuration
create table if not exists public.header_bidding_config (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  network_id uuid not null references public.ad_networks(id) on delete cascade,
  timeout_ms integer default 1000,
  floor_price numeric(10, 4),
  bid_modifier numeric(3, 2) default 1.0,
  active boolean default true,
  unique (placement_id, network_id)
);

-- Native ad formats
create table if not exists public.native_ad_formats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  html_template text,  -- Template for rendering
  width integer,
  height integer,
  placement_context text check (placement_context in ('in_article', 'sidebar', 'feed', 'footer')),
  click_tracking_enabled boolean default true,
  created_at timestamptz not null default now()
);

-- Sponsored content (clearly labeled but monetized)
create table if not exists public.sponsored_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  sponsor_name text not null,
  sponsor_url text,
  sponsor_logo_url text,
  content_category text,
  published boolean default false,
  views_count integer default 0,
  clicks_count integer default 0,
  revenue_sek numeric(10, 2),
  cpc_sek numeric(10, 4),
  featured boolean default false,
  featured_until timestamptz,
  disclosure_text text default 'Sponsrat innehåll',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- Affiliate link optimization (smart placement)
create table if not exists public.affiliate_link_placements (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  placement_location text not null check (placement_location in ('article_inline', 'article_end', 'sidebar', 'hero', 'footer', 'modal')),
  placement_context jsonb,  -- e.g., {"category": "sport", "relevance_score": 0.95}
  click_probability numeric(3, 2),  -- ML-predicted CTR
  conversion_probability numeric(3, 2),
  expected_revenue numeric(10, 4),
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  revenue_generated numeric(10, 2) default 0,
  ab_test_variant text,  -- e.g., "button_red_v1", "link_text_v2"
  performance_score numeric(3, 2),  -- 0-1
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Premium ad placements (high-value spots)
create table if not exists public.premium_ad_placements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  placement_type text not null check (placement_type in ('sticky_header', 'sticky_footer', 'above_fold', 'modal_popup', 'interstitial')),
  width integer,
  height integer,
  viewability_score numeric(3, 2),  -- 0-1
  click_probability numeric(3, 2),
  base_cpm_premium numeric(10, 4),  -- Higher than standard
  fill_rate numeric(3, 2),  -- How often filled with ads
  active boolean default true,
  created_at timestamptz not null default now()
);

-- Retargeting pixel tracking
create table if not exists public.retargeting_pixels (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  network_name text not null,  -- e.g., "facebook", "google", "adroll"
  pixel_code text not null,
  event_type text check (event_type in ('page_view', 'click', 'add_to_cart', 'purchase')),
  active boolean default true,
  created_at timestamptz not null default now()
);

-- User segments for retargeting
create table if not exists public.retargeting_segments (
  id uuid primary key default gen_random_uuid(),
  segment_name text not null,
  description text,
  segment_rules jsonb,  -- e.g., {"visited_category": "sport", "times": {"min": 3}, "days_since": {"max": 7}}
  size_estimate integer,
  network_ids uuid[] default '{}',  -- Which networks to sync to
  active boolean default true,
  created_at timestamptz not null default now()
);

-- Native ad clicks & impressions
create table if not exists public.native_ad_events (
  id uuid primary key default gen_random_uuid(),
  native_ad_id uuid not null references public.sponsored_content(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click', 'conversion')),
  revenue_sek numeric(10, 4),
  user_country text,
  device_type text,
  referrer text,
  click_value numeric(10, 2),
  recorded_at timestamptz not null default now()
);

-- Contextual ad rules (ads that match content)
create table if not exists public.contextual_ad_rules (
  id uuid primary key default gen_random_uuid(),
  content_category text,  -- e.g., "sport", "tech", "lifestyle"
  keyword_triggers text[] not null default '{}',
  recommended_ad_network_ids uuid[] not null default '{}',
  bid_boost numeric(3, 2) default 1.0,
  notes text,
  created_at timestamptz not null default now()
);

-- Revenue floor management (don't sell below minimum)
create table if not exists public.revenue_floor_rules (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  country text,  -- 'SE', 'NO', 'DK', or null for all
  min_cpm numeric(10, 4),
  min_cpc numeric(10, 4),
  effective_from date,
  effective_until date,
  priority integer default 10,
  created_at timestamptz not null default now(),
  unique (placement_id, country)
);

-- Dynamic creative optimization (which ads convert best)
create table if not exists public.dynamic_creative_optimization (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  variation text,  -- e.g., "headline_v1", "color_blue"
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  revenue_sek numeric(10, 2) default 0,
  ctr numeric(5, 2),
  conversion_rate numeric(5, 2),
  performance_index numeric(3, 2),  -- 0-2 (1.0 = average)
  winner boolean default false,
  test_status text default 'running' check (test_status in ('running', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

-- Affiliate smart recommendations (in-content suggestions)
create table if not exists public.affiliate_recommendations (
  id uuid primary key default gen_random_uuid(),
  article_id text,  -- FK to articles table (if exists)
  offer_id uuid not null references public.offers(id) on delete cascade,
  recommendation_type text check (recommendation_type in ('contextual', 'trending', 'high_commission', 'sponsored')),
  relevance_score numeric(3, 2),  -- 0-1
  commission_rate numeric(5, 2),
  expected_revenue numeric(10, 4),
  position_in_article integer,  -- 1, 2, 3, etc
  call_to_action text,
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  created_at timestamptz not null default now()
);

-- Revenue reporting (all monetization combined)
create table if not exists public.revenue_report_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  affiliate_revenue_sek numeric(12, 2),
  display_ads_revenue_sek numeric(12, 2),
  native_ads_revenue_sek numeric(12, 2),
  sponsored_content_revenue_sek numeric(12, 2),
  header_bidding_revenue_sek numeric(12, 2),
  premium_placement_revenue_sek numeric(12, 2),
  other_revenue_sek numeric(12, 2) default 0,
  total_revenue_sek numeric(12, 2),
  page_views integer,
  unique_visitors integer,
  cpm_average numeric(10, 4),
  revenue_per_visitor numeric(10, 2),
  created_at timestamptz not null default now()
);

-- Content recommendation engine (drive engagement)
create table if not exists public.content_recommendations (
  id uuid primary key default gen_random_uuid(),
  source_content_id text,
  recommended_content_id text,
  content_type text check (content_type in ('article', 'offer', 'sponsored')),
  recommendation_reason text,  -- "similar_category", "trending", "high_revenue"
  position integer,  -- Display order
  click_count integer default 0,
  revenue_generated numeric(10, 2) default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ad_networks enable row level security;
alter table public.header_bidding_config enable row level security;
alter table public.native_ad_formats enable row level security;
alter table public.sponsored_content enable row level security;
alter table public.affiliate_link_placements enable row level security;
alter table public.premium_ad_placements enable row level security;
alter table public.retargeting_pixels enable row level security;
alter table public.retargeting_segments enable row level security;
alter table public.native_ad_events enable row level security;
alter table public.contextual_ad_rules enable row level security;
alter table public.revenue_floor_rules enable row level security;
alter table public.dynamic_creative_optimization enable row level security;
alter table public.affiliate_recommendations enable row level security;
alter table public.revenue_report_daily enable row level security;
alter table public.content_recommendations enable row level security;
