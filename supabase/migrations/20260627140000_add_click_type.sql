-- Track what kind of interaction generated a click so we can separate
-- "copy discount code" actions from "go to website" actions per offer.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'click_type') then
    create type public.click_type as enum ('discount_code', 'website');
  end if;
end $$;

alter table public.click_events
  add column if not exists click_type public.click_type not null default 'website';

-- Reset historical click data: counts were inflated by non-real traffic and
-- did not distinguish interaction type. We start counting only real clicks.
delete from public.click_events;

create index if not exists click_events_offer_type_idx
on public.click_events (offer_id, click_type);
