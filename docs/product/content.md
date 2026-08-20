# Innehållsmodell och redaktion

## Artiklar

Tabellen `articles` har tre typer:

- `best_in_test` → `/bast-i-test/[slug]`
- `review` → `/recensioner/[slug]`
- `guide` → `/guider/[slug]`

Skapa dem i admin under **Artiklar**. Produkter för recensioner skapas under **Produkter**.

### Metod – viktigt

- `tested_by_us` – använd bara om produkten faktiskt testats av oss.
- `editorial_evaluation` – redaktionell bedömning utan fysiskt test.
- `compared_from_sources` – jämförelse utifrån specifikationer och källor.

Fabricera aldrig tester, recensionsantal eller “fungerar för X %” utan data.

Bäst i test jämför produkter i fältet `compared_products` (JSON). Recensioner kan peka på en `product_id`.

## Butiker och erbjudanden

- Butik: `/admin/butiker` – intro, spartips, utvald, affiliatelänk.
- Erbjudande: `/admin/erbjudanden` – sponsrat, exklusivt, verifierad, priser.
- Affiliateklick går via `/go/[offerId]` för erbjudanden och `/go/butik/[slug]`
  för butikens egen länk. Befintliga spårningsparametrar skrivs aldrig om.
- Sponsring höjer inte Deal Score.

### Kommersiella etiketter

Etiketter speglar bara faktiska affärsuppgörelser:

| Flagga | Etikett |
| --- | --- |
| `is_sponsored` | Sponsrat |
| `is_exclusive` | Exklusivt erbjudande |

`is_featured` är redaktionellt (“Utvald”) och får aldrig märkas som samarbete.

### Verifiering

“Senast verifierad” visas bara när `last_verified_at` (satt av admin) eller
`last_synced_at` (bekräftat av affiliatefeeden) finns. `updated_at` räknas inte
som verifiering – en redigering är inte en kontroll.

## Rabattkodsfeedback

Besökare kan svara “Fungerade rabattkoden?” utan konto. En röst per IP-hash och erbjudande; ett nytt svar ersätter det tidigare. Procentsiffra visas först efter 5 svar.

## Nyhetsbrev

Intressen sparas på `deal_subscribers.interests`. Själva utskicket kräver separat e-postintegration – ingen fejkad delivery finns i koden.

## SEO

- `hasIndexableContent()` i `src/shared/lib/indexing.ts` avgör om en butiks-
  eller kategorisida är värd att indexera. Samma regel används av både sidans
  robots-tagg och `sitemap.ts`, så de kan inte säga emot varandra. Kravet är
  minst ett aktivt erbjudande, minst en artikel, eller minst 120 tecken intro.
- Filter-URL:er på `/erbjudanden` och `/rabattkoder` är `noindex`.
- `/sok`, `/admin`, `/go`, `/advertiser` och `/api` ska inte indexeras.
- Utgångna erbjudanden behåller URL men indexeras inte; sidan föreslår nya deals.
- Strukturerad data skrivs bara ut när sidan visar samma uppgifter: `Offer`
  får `price` först när priset syns, och `Review` kräver betyg, omdöme och en
  kopplad produkt.

## Klick och popularitet

Popularitet räknas i Postgres via `count_offer_clicks_since`,
`count_store_clicks_since` och `count_offer_clicks_by_type`. Hämta aldrig råa
`click_events`-rader för att räkna – PostgREST kapar svaret och siffrorna blir
tysta fel.
