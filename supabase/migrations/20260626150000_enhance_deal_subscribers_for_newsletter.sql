alter table public.deal_subscribers
add column if not exists consent_given_at timestamptz not null default now(),
add column if not exists consent_text text not null default 'Jag vill få erbjudanden och kampanjer via e-post från braerbjudanden.se.',
add column if not exists last_signup_at timestamptz not null default now(),
add column if not exists signup_count integer not null default 1,
add column if not exists signup_sources text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'deal_subscribers_signup_count_positive'
    and conrelid = 'public.deal_subscribers'::regclass
  ) then
    alter table public.deal_subscribers
    add constraint deal_subscribers_signup_count_positive check (signup_count > 0);
  end if;
end $$;

update public.deal_subscribers
set signup_sources = array[source]
where signup_sources = '{}';

create index if not exists deal_subscribers_last_signup_at_idx
on public.deal_subscribers (last_signup_at desc);

create or replace function public.register_deal_subscriber(
  p_email text,
  p_source text default 'unknown',
  p_consent_text text default 'Jag vill få erbjudanden och kampanjer via e-post från braerbjudanden.se.'
)
returns public.deal_subscribers
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email citext;
  normalized_source text;
  subscriber public.deal_subscribers;
begin
  normalized_email := lower(trim(p_email))::citext;
  normalized_source := nullif(trim(coalesce(p_source, 'unknown')), '');

  if normalized_source is null then
    normalized_source := 'unknown';
  end if;

  if position('@' in normalized_email::text) <= 1 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  insert into public.deal_subscribers (
    email,
    status,
    source,
    consent_text,
    consent_given_at,
    last_signup_at,
    signup_count,
    signup_sources
  )
  values (
    normalized_email,
    'active',
    normalized_source,
    p_consent_text,
    now(),
    now(),
    1,
    array[normalized_source]
  )
  on conflict (email) do update
  set
    status = 'active',
    source = excluded.source,
    consent_text = excluded.consent_text,
    consent_given_at = excluded.consent_given_at,
    last_signup_at = excluded.last_signup_at,
    signup_count = public.deal_subscribers.signup_count + 1,
    signup_sources = case
      when excluded.source = any(public.deal_subscribers.signup_sources)
        then public.deal_subscribers.signup_sources
      else public.deal_subscribers.signup_sources || excluded.source
    end
  returning * into subscriber;

  return subscriber;
end;
$$;

revoke all on function public.register_deal_subscriber(text, text, text)
from public, anon, authenticated;

grant execute on function public.register_deal_subscriber(text, text, text)
to service_role;
