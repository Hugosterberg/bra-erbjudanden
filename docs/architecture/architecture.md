# Arkitektur

## Översikt

Projektet ska byggas med Next.js App Router och vertical slice architecture.

## Rekommenderad struktur

```txt
src/
  app/
    (public)/
      erbjudanden/
      rabattkoder/
      butiker/
      kategorier/
      bast-i-test/
      recensioner/
      guider/
      sok/
      partner/
    admin/
    api/
  features/
    offers/
      components/
      data/
      schemas/
      actions/
      types.ts
    stores/
    categories/
    clicks/
    admin/
  shared/
    ui/
    lib/
    config/
    types/
  supabase/
    client.ts
    server.ts
```

## Data access

- Lägg feature-specifik data access i respektive feature.
- Supabase-klienter ska ligga centralt i `shared/lib` eller `supabase/`.
- Server-side queries ska prioriteras för publika sidor.
- Mutations ska valideras med Zod.

## Auth

Första versionen har endast admin.

Admin nås endast via `/admin` och skyddas server-side med ett lösenord från
miljövariabeln `ADMIN_PASSWORD`. Efter korrekt lösenord sätts en httpOnly-cookie.
Admin-CRUD använder Supabase service role server-side efter lösenordsguard.

## Klickspårning

Rekommenderad lösning:

- Publik länk går till intern route, exempel `/go/[offerId]`.
- Servern registrerar klick.
- Servern redirectar till affiliate_url.

Detta gör klickspårning robust och enkel.

## SEO

- Använd metadata i App Router.
- Skapa SEO-vänliga slugs.
- Använd server-renderade publika sidor.
- Lägg till Open Graph metadata.
- Förbered sitemap och robots.
