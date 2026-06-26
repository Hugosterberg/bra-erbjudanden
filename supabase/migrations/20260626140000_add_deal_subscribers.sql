create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscriber_status') then
    create type public.subscriber_status as enum ('active', 'unsubscribed');
  end if;
end $$;

create table if not exists public.deal_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status public.subscriber_status not null default 'active',
  source text not null default 'homepage',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_subscribers_email_has_at check (position('@' in email::text) > 1)
);

drop trigger if exists deal_subscribers_set_updated_at on public.deal_subscribers;
create trigger deal_subscribers_set_updated_at
before update on public.deal_subscribers
for each row execute function public.set_updated_at();

create index if not exists deal_subscribers_status_created_at_idx
on public.deal_subscribers (status, created_at desc);

alter table public.deal_subscribers enable row level security;
