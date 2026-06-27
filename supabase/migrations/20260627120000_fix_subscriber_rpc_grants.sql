-- Ensure the newsletter RPC is callable with service-role credentials.
-- Newer Supabase API keys may not map cleanly to legacy role grants.
grant usage on schema public to service_role;

grant execute on function public.register_deal_subscriber(text, text, text)
to service_role;

grant all on table public.deal_subscribers to service_role;
