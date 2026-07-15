-- Per-network import runs: one row per affiliatenätverk per batch, for granular tracking.

alter table public.affiliate_import_runs
  drop constraint if exists affiliate_import_runs_status_check;

alter table public.affiliate_import_runs
  add constraint affiliate_import_runs_status_check
  check (status in ('running', 'completed', 'completed_with_errors', 'failed'));

create table if not exists public.affiliate_import_network_runs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.affiliate_import_runs(id) on delete cascade,
  affiliate_network public.affiliate_network not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'completed', 'completed_with_errors', 'failed')),
  fetched integer not null default 0 check (fetched >= 0),
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  archived_count integer not null default 0 check (archived_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  errors jsonb not null default '[]'::jsonb
);

create index if not exists affiliate_import_network_runs_batch_idx
  on public.affiliate_import_network_runs (batch_id);

create index if not exists affiliate_import_network_runs_network_started_idx
  on public.affiliate_import_network_runs (affiliate_network, started_at desc);

create index if not exists affiliate_import_network_runs_status_idx
  on public.affiliate_import_network_runs (status, started_at desc);
