-- Advanced Ad Network: Smart bidding, fraud detection, webhooks, conversions

-- Fraud detection & click patterns
create table if not exists public.click_fraud_detection (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  click_id uuid not null references public.ad_clicks(id) on delete cascade,
  risk_score numeric(3, 1) not null default 0 check (risk_score >= 0 and risk_score <= 10),
  risk_flags text[] default '{}',
  is_fraudulent boolean default false,
  detected_at timestamptz not null default now(),
  notes text
);

create index if not exists click_fraud_detection_campaign_idx
  on public.click_fraud_detection (campaign_id);

create index if not exists click_fraud_detection_fraudulent_idx
  on public.click_fraud_detection (is_fraudulent)
  where is_fraudulent = true;

-- Campaign performance predictions
create table if not exists public.campaign_performance_forecast (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  forecast_date date not null,
  predicted_impressions integer,
  predicted_clicks integer,
  predicted_spend_sek numeric(10, 2),
  predicted_ctr numeric(5, 2),
  confidence_score numeric(3, 2),
  created_at timestamptz not null default now()
);

create unique index if not exists campaign_performance_forecast_campaign_date_idx
  on public.campaign_performance_forecast (campaign_id, forecast_date);

-- Conversion tracking
create table if not exists public.ad_conversions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  click_id uuid references public.ad_clicks(id) on delete set null,
  conversion_type text not null check (conversion_type in ('purchase', 'signup', 'lead', 'view', 'custom')),
  conversion_value numeric(10, 2),
  external_conversion_id text,
  pixel_fired boolean default false,
  ip_hash text,
  recorded_at timestamptz not null default now()
);

create index if not exists ad_conversions_campaign_idx
  on public.ad_conversions (campaign_id);

create index if not exists ad_conversions_recorded_idx
  on public.ad_conversions (recorded_at desc);

-- Webhook endpoints for advertisers
create table if not exists public.advertiser_webhooks (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_accounts(id) on delete cascade,
  event_type text not null check (event_type in ('campaign.created', 'campaign.approved', 'impression', 'click', 'conversion', 'budget_warning', 'campaign.paused')),
  webhook_url text not null,
  signing_secret text not null,
  active boolean not null default true,
  last_triggered_at timestamptz,
  failure_count integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists advertiser_webhooks_advertiser_idx
  on public.advertiser_webhooks (advertiser_id);

create index if not exists advertiser_webhooks_active_idx
  on public.advertiser_webhooks (active);

-- Webhook delivery log
create table if not exists public.webhook_delivery_log (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.advertiser_webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  http_status integer,
  response_body text,
  attempts integer default 1,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz
);

create index if not exists webhook_delivery_log_webhook_idx
  on public.webhook_delivery_log (webhook_id);

create index if not exists webhook_delivery_log_delivered_idx
  on public.webhook_delivery_log (delivered_at desc);

-- Smart bid suggestions (AI-powered)
create table if not exists public.bid_suggestions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  current_bid numeric(10, 4) not null,
  suggested_bid numeric(10, 4) not null,
  reason text not null,
  estimated_roi numeric(5, 2),
  confidence numeric(3, 2),
  model_version text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  dismissed_at timestamptz
);

create index if not exists bid_suggestions_campaign_idx
  on public.bid_suggestions (campaign_id);

create index if not exists bid_suggestions_created_idx
  on public.bid_suggestions (created_at desc);

-- A/B testing for creatives
create table if not exists public.ad_creative_tests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  control_creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  variant_creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  test_type text not null check (test_type in ('headline', 'image', 'copy', 'cta')),
  winner_id uuid references public.ad_creatives(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'completed', 'paused')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  statistical_significance numeric(3, 2),
  confidence_level numeric(3, 2)
);

create index if not exists ad_creative_tests_campaign_idx
  on public.ad_creative_tests (campaign_id);

create index if not exists ad_creative_tests_status_idx
  on public.ad_creative_tests (status);

-- Performance alerts & budget warnings
create table if not exists public.campaign_alerts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  alert_type text not null check (alert_type in ('budget_warning', 'low_ctr', 'high_cpc', 'fraud_detected', 'underperforming')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  message text not null,
  threshold_value numeric,
  current_value numeric,
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create index if not exists campaign_alerts_campaign_idx
  on public.campaign_alerts (campaign_id);

create index if not exists campaign_alerts_unacknowledged_idx
  on public.campaign_alerts (acknowledged_at)
  where acknowledged_at is null;

-- Advanced targeting options
create table if not exists public.placement_targeting_options (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  targeting_type text not null check (targeting_type in ('device_type', 'time_of_day', 'day_of_week', 'weather', 'user_language', 'referrer_domain')),
  targeting_value text not null,
  boost_multiplier numeric(3, 2) default 1.0,
  active boolean default true
);

create index if not exists placement_targeting_options_placement_idx
  on public.placement_targeting_options (placement_id);

-- Monthly advertiser reports
create table if not exists public.advertiser_reports (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_accounts(id) on delete cascade,
  report_month date not null,
  total_campaigns integer,
  active_campaigns integer,
  total_impressions bigint,
  total_clicks bigint,
  total_conversions integer,
  total_spend_sek numeric(12, 2),
  average_ctr numeric(5, 2),
  average_cpc_sek numeric(10, 4),
  average_cpm_sek numeric(10, 4),
  roi numeric(5, 2),
  top_performing_campaign_id uuid,
  bottom_performing_campaign_id uuid,
  generated_at timestamptz not null default now(),
  sent_at timestamptz
);

create unique index if not exists advertiser_reports_advertiser_month_idx
  on public.advertiser_reports (advertiser_id, report_month);

-- RLS for new tables
alter table public.click_fraud_detection enable row level security;
alter table public.campaign_performance_forecast enable row level security;
alter table public.ad_conversions enable row level security;
alter table public.advertiser_webhooks enable row level security;
alter table public.webhook_delivery_log enable row level security;
alter table public.bid_suggestions enable row level security;
alter table public.ad_creative_tests enable row level security;
alter table public.campaign_alerts enable row level security;
alter table public.placement_targeting_options enable row level security;
alter table public.advertiser_reports enable row level security;

-- RLS policies (admin only for sensitive data)
create policy "admin_view_fraud_detection"
  on public.click_fraud_detection for select
  using (false);

create policy "admin_view_webhooks"
  on public.advertiser_webhooks for select
  using (false);

create policy "public_view_conversions"
  on public.ad_conversions for insert
  using (true);
