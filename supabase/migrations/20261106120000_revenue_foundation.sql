-- Revenue foundation: closes exposed tables, stops the import from fabricating
-- discounts and freshness, and adds the data needed to attribute commission.
-- Additive except for dropped policies. Ad-network tables are left in place.

-- ---------------------------------------------------------------------------
-- 1. Close policies that exposed revenue data or accepted anonymous writes.
-- ---------------------------------------------------------------------------
drop policy if exists "allow_public_view_revenue_events" on public.affiliate_revenue_events;
drop policy if exists "allow_public_view_daily_revenue" on public.affiliate_revenue_daily;
drop policy if exists "allow_public_view_active_sponsorships" on public.sponsorships;
drop policy if exists "public_view_active_campaigns" on public.ad_campaigns;
drop policy if exists "public_view_conversions" on public.ad_conversions;

-- Click volumes are commercially sensitive. Public pages now read them with
-- the service role on the server, so the anonymous grants can go.
revoke execute on function public.count_offer_clicks_since(timestamptz) from public, anon, authenticated;
revoke execute on function public.count_store_clicks_since(timestamptz) from public, anon, authenticated;
revoke execute on function public.count_offer_clicks_by_type() from public, anon, authenticated;
grant execute on function public.count_offer_clicks_since(timestamptz) to service_role;
grant execute on function public.count_store_clicks_since(timestamptz) to service_role;
grant execute on function public.count_offer_clicks_by_type() to service_role;

-- ---------------------------------------------------------------------------
-- 2. Offers may lack a numeric discount ("Fri frakt", "3 för 2", "Kampanj").
-- ---------------------------------------------------------------------------
alter table public.offers
  alter column discount_type drop not null,
  alter column discount_value drop not null,
  add column if not exists deal_label text,
  add column if not exists is_up_to boolean not null default false,
  add column if not exists is_import_locked boolean not null default false,
  add column if not exists import_archived_status public.offer_status,
  add column if not exists market text not null default 'SE';

alter table public.offers drop constraint if exists offers_discount_value_positive;
alter table public.offers
  add constraint offers_discount_value_positive
    check (discount_value is null or discount_value > 0),
  add constraint offers_discount_type_value_paired
    check ((discount_type is null) = (discount_value is null));

alter table public.stores
  add column if not exists market text not null default 'SE';

create index if not exists offers_market_status_idx on public.offers (market, status);

-- A feed appearing in a sync is not a verification, so it is cleared. The trigger
-- is paused so that the cleanup does not make every offer look freshly edited.
alter table public.offers disable trigger offers_set_updated_at;
update public.offers set last_verified_at = null where is_imported;
alter table public.offers enable trigger offers_set_updated_at;

-- updated_at drives freshness in Deal Score, sitemap lastmod and "newest", so
-- ranking changes and sync timestamps must not count as an edit.
create or replace function public.offers_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array['updated_at', 'rank_position', 'last_synced_at'])
     is distinct from
     (to_jsonb(old) - array['updated_at', 'rank_position', 'last_synced_at']) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.offers_touch_updated_at();

create or replace function public.recalculate_imported_ranks(
  p_network public.affiliate_network,
  p_first_rank integer
)
returns void
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      id,
      p_first_rank - 1 + row_number() over (
        order by
          case discount_type when 'percentage' then 0 when 'fixed_amount' then 1 else 2 end,
          discount_value desc nulls last,
          created_at asc
      ) as next_rank
    from public.offers
    where affiliate_network = p_network
      and is_imported
      and status = 'published'
  )
  update public.offers
  set rank_position = ranked.next_rank
  from ranked
  where offers.id = ranked.id
    and offers.rank_position is distinct from ranked.next_rank;
$$;

revoke all on function public.recalculate_imported_ranks(public.affiliate_network, integer)
  from public, anon, authenticated;
grant execute on function public.recalculate_imported_ranks(public.affiliate_network, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. One store can belong to programmes in several networks.
-- ---------------------------------------------------------------------------
create table if not exists public.store_affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  network public.affiliate_network not null,
  external_id text not null,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_affiliate_programs_network_external_unique unique (network, external_id)
);

create index if not exists store_affiliate_programs_store_idx
  on public.store_affiliate_programs (store_id);

drop trigger if exists store_affiliate_programs_set_updated_at on public.store_affiliate_programs;
create trigger store_affiliate_programs_set_updated_at
before update on public.store_affiliate_programs
for each row execute function public.set_updated_at();

insert into public.store_affiliate_programs (store_id, network, external_id, tracking_url)
select id, affiliate_network, external_id, affiliate_url
from public.stores
where affiliate_network is not null and external_id is not null
on conflict (network, external_id) do nothing;

alter table public.store_affiliate_programs enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Click identifiers tie a network transaction back to a page and an offer.
-- ---------------------------------------------------------------------------
alter table public.click_events
  alter column offer_id drop not null,
  add column if not exists click_id uuid,
  add column if not exists network public.affiliate_network;

create unique index if not exists click_events_click_id_idx
  on public.click_events (click_id)
  where click_id is not null;

create or replace function public.count_offer_clicks_since(since timestamptz)
returns table (offer_id uuid, click_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select click_events.offer_id, count(*)::bigint
  from public.click_events
  where click_events.clicked_at >= since
    and click_events.offer_id is not null
  group by click_events.offer_id;
$$;

create or replace function public.count_offer_clicks_by_type()
returns table (offer_id uuid, click_type public.click_type, click_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select click_events.offer_id, click_events.click_type, count(*)::bigint
  from public.click_events
  where click_events.offer_id is not null
  group by click_events.offer_id, click_events.click_type;
$$;

-- ---------------------------------------------------------------------------
-- 5. Commission reported by the networks.
-- ---------------------------------------------------------------------------
create table if not exists public.network_transactions (
  id uuid primary key default gen_random_uuid(),
  network public.affiliate_network not null,
  external_id text not null,
  program_external_id text,
  click_ref text,
  click_id uuid,
  store_id uuid references public.stores(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'paid')),
  commission numeric(12, 2) not null default 0,
  order_value numeric(12, 2),
  currency text not null default 'SEK',
  transaction_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_transactions_network_external_unique unique (network, external_id)
);

create index if not exists network_transactions_transaction_at_idx
  on public.network_transactions (transaction_at desc);
create index if not exists network_transactions_click_id_idx
  on public.network_transactions (click_id)
  where click_id is not null;
create index if not exists network_transactions_store_idx
  on public.network_transactions (store_id, transaction_at desc);

drop trigger if exists network_transactions_set_updated_at on public.network_transactions;
create trigger network_transactions_set_updated_at
before update on public.network_transactions
for each row execute function public.set_updated_at();

alter table public.network_transactions enable row level security;

create table if not exists public.network_transaction_sync_runs (
  id uuid primary key default gen_random_uuid(),
  network public.affiliate_network not null,
  status text not null check (status in ('completed', 'failed')),
  fetched integer not null default 0,
  error text,
  ran_at timestamptz not null default now()
);

create index if not exists network_transaction_sync_runs_ran_at_idx
  on public.network_transaction_sync_runs (network, ran_at desc);

alter table public.network_transaction_sync_runs enable row level security;

create or replace function public.revenue_summary(
  p_dimension text,
  p_since timestamptz
)
returns table (
  dimension_key text,
  dimension_label text,
  currency text,
  clicks bigint,
  transactions bigint,
  pending_commission numeric,
  approved_commission numeric,
  rejected_commission numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with click_totals as (
    select
      case p_dimension
        when 'network' then click_events.network::text
        when 'store' then click_events.store_id::text
        when 'offer' then click_events.offer_id::text
        when 'page' then coalesce(
          nullif(substring(click_events.referrer from '^https?://[^/]+(/[^?#]*)'), ''),
          '(okänd)'
        )
      end as key,
      count(*)::bigint as clicks
    from public.click_events
    where click_events.clicked_at >= p_since
      and click_events.click_type = 'website'
    group by 1
  ),
  sales as (
    select
      case p_dimension
        when 'network' then network_transactions.network::text
        when 'store' then network_transactions.store_id::text
        when 'offer' then network_transactions.offer_id::text
        when 'page' then coalesce(
          nullif(substring(click_events.referrer from '^https?://[^/]+(/[^?#]*)'), ''),
          '(okänd)'
        )
      end as key,
      network_transactions.currency,
      count(*)::bigint as transactions,
      coalesce(sum(commission) filter (where status = 'pending'), 0) as pending_commission,
      coalesce(sum(commission) filter (where status in ('approved', 'paid')), 0) as approved_commission,
      coalesce(sum(commission) filter (where status = 'rejected'), 0) as rejected_commission
    from public.network_transactions
    left join public.click_events on click_events.click_id = network_transactions.click_id
    where network_transactions.transaction_at >= p_since
    group by 1, 2
  )
  select
    coalesce(sales.key, click_totals.key) as dimension_key,
    case p_dimension
      when 'store' then (select name from public.stores where id::text = coalesce(sales.key, click_totals.key))
      when 'offer' then (select title from public.offers where id::text = coalesce(sales.key, click_totals.key))
      else coalesce(sales.key, click_totals.key)
    end as dimension_label,
    coalesce(sales.currency, 'SEK') as currency,
    coalesce(click_totals.clicks, 0)::bigint as clicks,
    coalesce(sales.transactions, 0)::bigint as transactions,
    coalesce(sales.pending_commission, 0) as pending_commission,
    coalesce(sales.approved_commission, 0) as approved_commission,
    coalesce(sales.rejected_commission, 0) as rejected_commission
  from click_totals
  full outer join sales on coalesce(sales.key, '') = coalesce(click_totals.key, '')
  order by 7 desc, 6 desc, 4 desc
  limit 50;
$$;

revoke all on function public.revenue_summary(text, timestamptz) from public, anon, authenticated;
grant execute on function public.revenue_summary(text, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Shared rate limit counter: in-memory limits do not survive serverless.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_counters (
  key text primary key,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limit_counters enable row level security;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
begin
  -- Opportunistic cleanup keeps the table small without a scheduled job.
  if random() < 0.01 then
    delete from public.rate_limit_counters
    where window_started_at < now() - interval '1 day';
  end if;

  insert into public.rate_limit_counters as counters (key, window_started_at, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
  set
    hits = case
      when counters.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
      else counters.hits + 1
    end,
    window_started_at = case
      when counters.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
      else counters.window_started_at
    end
  returning hits into current_hits;

  return current_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Double opt-in, one-click unsubscribe and newsletter delivery log.
-- ---------------------------------------------------------------------------
alter table public.deal_subscribers
  add column if not exists confirmation_token uuid unique default gen_random_uuid(),
  add column if not exists unsubscribe_token uuid not null unique default gen_random_uuid(),
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  intro text,
  offer_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists newsletter_campaigns_set_updated_at on public.newsletter_campaigns;
create trigger newsletter_campaigns_set_updated_at
before update on public.newsletter_campaigns
for each row execute function public.set_updated_at();

create table if not exists public.newsletter_deliveries (
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.deal_subscribers(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (campaign_id, subscriber_id)
);

alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_deliveries enable row level security;
