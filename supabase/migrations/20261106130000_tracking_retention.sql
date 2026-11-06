-- Limits how long visitor-related tracking data is kept, as promised on
-- /integritetspolicy. Click rows stay because commission reports depend on them,
-- but what could point to a visitor is removed.
create or replace function public.purge_tracking_data(
  p_identifier_days integer,
  p_event_days integer
)
returns table (clicks_anonymized bigint, events_anonymized bigint, events_deleted bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  identifier_cutoff timestamptz := now() - make_interval(days => p_identifier_days);
  event_cutoff timestamptz := now() - make_interval(days => p_event_days);
begin
  update public.click_events
  set ip_hash = null, user_agent = null
  where clicked_at < identifier_cutoff
    and (ip_hash is not null or user_agent is not null);
  get diagnostics clicks_anonymized = row_count;

  delete from public.discovery_events
  where occurred_at < event_cutoff;
  get diagnostics events_deleted = row_count;

  update public.discovery_events
  set ip_hash = null
  where occurred_at < identifier_cutoff
    and ip_hash is not null;
  get diagnostics events_anonymized = row_count;

  return next;
end;
$$;

revoke all on function public.purge_tracking_data(integer, integer) from public, anon, authenticated;
grant execute on function public.purge_tracking_data(integer, integer) to service_role;
