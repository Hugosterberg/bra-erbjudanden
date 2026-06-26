do $$
begin
  if not exists (select 1 from pg_type where typname = 'redemption_type') then
    create type public.redemption_type as enum ('discount_code', 'direct_link');
  end if;
end $$;

alter table public.offers
add column if not exists redemption_type public.redemption_type not null default 'direct_link';

update public.offers
set redemption_type = 'discount_code'
where nullif(btrim(discount_code), '') is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offers_discount_code_required'
      and conrelid = 'public.offers'::regclass
  ) then
    alter table public.offers
    add constraint offers_discount_code_required check (
      redemption_type = 'direct_link'
      or nullif(btrim(discount_code), '') is not null
    );
  end if;
end $$;
