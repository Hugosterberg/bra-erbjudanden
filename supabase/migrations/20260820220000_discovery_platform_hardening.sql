-- Hardening of the discovery platform:
-- 1. An explicit exclusivity flag so commercial labels have honest sources.
-- 2. Removal of verification timestamps that were backfilled from updated_at.
-- 3. Aggregated click counters so popularity does not depend on fetching every
--    click row (PostgREST caps rows, which silently truncated the counts).

alter table public.offers
  add column if not exists is_exclusive boolean not null default false;

-- The initial discovery migration backfilled last_verified_at from updated_at
-- for offers that were never imported. That claims a verification that never
-- happened, so it is cleared. Imported offers keep last_synced_at as evidence,
-- and anything verified by an admin after the backfill is left untouched.
-- The updated_at trigger is paused so the cleanup does not make every offer
-- look freshly edited.
alter table public.offers disable trigger offers_set_updated_at;

update public.offers
set last_verified_at = null
where last_verified_at is not null
  and last_synced_at is null
  and last_verified_at < timestamptz '2026-08-20 12:00:00+00';

alter table public.offers enable trigger offers_set_updated_at;

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
  group by click_events.offer_id;
$$;

create or replace function public.count_store_clicks_since(since timestamptz)
returns table (store_id uuid, click_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select click_events.store_id, count(*)::bigint
  from public.click_events
  where click_events.clicked_at >= since
    and click_events.store_id is not null
  group by click_events.store_id;
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
  group by click_events.offer_id, click_events.click_type;
$$;

-- Aggregated counts contain no personal data, so the public client may read
-- them. The underlying click_events rows stay protected by RLS.
grant execute on function public.count_offer_clicks_since(timestamptz) to anon, authenticated;
grant execute on function public.count_store_clicks_since(timestamptz) to anon, authenticated;

create index if not exists click_events_clicked_at_idx
  on public.click_events (clicked_at desc);

create index if not exists click_events_store_clicked_idx
  on public.click_events (store_id, clicked_at desc)
  where store_id is not null;
