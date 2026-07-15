-- Affiliate network auto-import: external IDs, sync metadata, import run logs.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'affiliate_network') then
    create type public.affiliate_network as enum (
      'addrevenue',
      'adtraction',
      'adrecord',
      'awin',
      'tradedoubler'
    );
  end if;
end $$;

alter table public.stores
  add column if not exists affiliate_network public.affiliate_network,
  add column if not exists external_id text;

create unique index if not exists stores_network_external_id_idx
  on public.stores (affiliate_network, external_id)
  where external_id is not null;

alter table public.offers
  add column if not exists affiliate_network public.affiliate_network,
  add column if not exists external_id text,
  add column if not exists is_imported boolean not null default false,
  add column if not exists imported_at timestamptz,
  add column if not exists last_synced_at timestamptz;

create unique index if not exists offers_network_external_id_idx
  on public.offers (affiliate_network, external_id)
  where external_id is not null;

create index if not exists offers_imported_status_idx
  on public.offers (is_imported, status, affiliate_network);

create table if not exists public.affiliate_import_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  networks text[] not null default '{}',
  stats jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb
);

create index if not exists affiliate_import_runs_started_at_idx
  on public.affiliate_import_runs (started_at desc);
