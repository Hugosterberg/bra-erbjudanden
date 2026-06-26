# Supabase-riktlinjer

## Databas

Skapa tabeller för:

- offers
- stores
- categories
- click_events
- admin_profiles eller user_roles vid behov

## RLS

Aktivera Row Level Security.

Publikt ska kunna läsa publicerade erbjudanden, butiker och kategorier.

Endast admin ska kunna skapa, uppdatera och arkivera erbjudanden.

Click events ska kunna skapas via säker serverroute, inte fritt manipuleras från klienten.

## Miljövariabler

Använd moderna Supabase-variabler:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY endast server-side vid behov

Exponera aldrig service role key i klientkod.
