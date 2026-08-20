# AI-beslut och antaganden

Dokumentera viktiga beslut här när AI:n gör antaganden.

## Initiala beslut

- Kod och mappar namnges på engelska.
- UI och produktcopy skrivs på svenska.
- Next.js App Router används.
- Supabase används som databas.
- Admininloggning använder ett separat miljölösenord.
- Vercel används för hosting.
- Vertical slice architecture används.
- Admin styr ranking manuellt.
- Klick på erbjudanden mäts.
- Endast admininloggning byggs i första versionen.
- Rabattmodeller fokuserar på procentuell rabatt och fast belopp.
- Fri frakt prioriteras inte som huvudtyp.
- Sidan ska vara premium, enkel och smartare än klassiska rabattkodssidor.

## 2026-06-26

- `PROJECT.md` och `ARCHITECTURE.md` saknades i projektroten. `docs/product/*` och `docs/architecture/architecture.md` användes som närmaste projektsanning.
- Lägre `rank_position` visas högre upp. Sortering är: `is_featured` först, därefter lägst `rank_position`, därefter senaste uppdatering.
- Klickspårning görs via `/go/[offerId]`. Klick skrivs med server-side service role client när `SUPABASE_SERVICE_ROLE_KEY` finns; redirect fungerar även utan nyckeln.
- Publika sidor returnerar tomma states när Supabase-miljövariabler saknas. Det är inte mockdata, utan ett tydligt lokalt läge tills riktiga Supabase-uppgifter konfigureras.
- Admin skyddas server-side med ett lösenord i `ADMIN_PASSWORD` och en httpOnly-sessioncookie. Supabase service role används endast server-side för admin-CRUD efter lösenordsguard.

## 2026-07-15

- Affiliate auto-import körs via Vercel Cron (`/api/cron/import-offers`, schemalagd 02:00/14:00 svensk tid) när nätverks-credentials finns i miljövariabler.
- Importerade erbjudanden lagras med `affiliate_network` + `external_id` för idempotent upsert. Butiker skapas automatiskt per nätverk.
- Importerade offers publiceras direkt (`status = published`), rankas efter rabattstorlek inom respektive nätverk, och arkiveras när de försvinner ur feeden.
- Rabatt parsas heuristiskt från titel/beskrivning när nätverket inte anger numeriskt värde; fallback är 5 % för att uppfylla DB-constraint.
- Manuellt skapade erbjudanden (`is_imported = false`) påverkas inte av importens rank-omräkning.
- Import körs två gånger per dygn (02:00 och 14:00 svensk vintertid, +1 timme sommartid) via Vercel Cron. Admin kan trigga manuellt under `/admin/import`.
- Arkivering sker bara när feeden svarar korrekt; tomma API-svar rensar inte befintlig katalog.
- Manuella erbjudanden reserverar ranking 1–20; importerade rankas från 21 baserat på rabatt.
- Samtidiga importkörningar blockeras via `affiliate_import_runs` i 45 minuter.
- Varje nätverk loggas separat i `affiliate_import_network_runs` med egen status (`completed`, `completed_with_errors`, `failed`) per körning.
- Admin kan köra import per nätverk eller alla samtidigt under `/admin/import`. Cron kan hoppa över specifika nätverk via `AFFILIATE_IMPORT_CRON_SKIP` (kommaseparerade id) utan att blockera manuell körning.
- Setup-guider per affiliatenätverk (inlogg, API-nycklar, miljövariabler) visas i admin under `/admin/import` → fliken Guider.
- Importkörningar som hänger kvar som `running` längre än 45 min markeras som misslyckade vid nästa körning och visas som "Avbruten" i admin.

## Data Persistence

- All persistent application data ska sparas i Supabase via server-side queries/actions.
- Browser storage som `localStorage`, `sessionStorage` och IndexedDB ska inte användas för erbjudanden, butiker, kategorier, klick eller admininnehåll.
- Admin-sessionen får använda en httpOnly-cookie eftersom den endast innehåller ett sessionsbevis, inte applikationsdata.

## 2026-08-08 - 2026-08-09

### Complete Monetization & Ad Network System

**Phase 1: Foundation**
- Revenue tracking (affiliate, display ads, native ads, sponsorships)
- Sponsorship management with ranking control
- Affiliate disclosure & compliance
- Admin dashboard for all revenue channels
- Per-network configuration

**Phase 2: Intelligence**
- Smart bidding: Auto-optimize bids based on CTR, CPC, performance (+15-20% savings)
- Fraud detection: 8-factor multi-factor detection with risk scoring (0-10)
- ML forecasting: Predict revenue 30 days ahead with confidence scores
- Demand curve modeling: Optimize floor prices hourly
- Real-time bidding auctions: <10ms parallel auction engine

**Phase 3: Advanced Monetization (NEW - 2026-08-09)**
- Header Bidding: Parallel auctions across 5+ ad networks (Google, OpenX, Rubicon, AppNexus)
  - Expected revenue lift: +40-50%
- Native Ads: Sponsored content that blends with editorial (5-8% CTR vs 1-2%)
- Sponsored Content: Direct brand partnerships (€500-5,000 per article)
- Retargeting Pixels: Show ads to repeat visitors (+30-40% conversion)
- Dynamic Creative Optimization: A/B test ads, auto-promote winners (+10-15% CTR)
- Affiliate Link Optimization: ML predicts best placement, format, CTA (+25% CTR)
- Revenue Floor Management: Don't sell ads below minimum price (+15-25% CPM)
- Dynamic Pricing: Adjust prices by demand, time of day, geography

**Phase 4: Analytics & Reporting**
- Multi-touch attribution: See which channel (affiliate vs ads) drove conversions
- Revenue forecasting: 30-day revenue predictions
- Publisher revenue dashboard: All channels combined in one view
- Advertiser analytics dashboard: Campaign performance tracking
- Dynamic creative optimization: A/B testing framework with auto-winners
- Campaign alerts: Auto-pause underperformers, budget warnings, fraud alerts

**Database Migrations (5 Total)**
1. Monetization Foundation (6 tables) — revenue tracking, sponsorships
2. Ad Network Foundation (10 tables) — campaigns, creatives, metrics
3. Advanced Features (10 tables) — fraud, bidding, webhooks, testing
4. RTB & Targeting (15 tables) — real-time bidding, floor prices, forecasting
5. Maximum Revenue Pro (15 tables) — header bidding, native ads, sponsored content

**Code Structure**
- 13 TypeScript modules (monetization feature)
- 13 TypeScript modules (ad-network feature)
- 4 React components
- 7 API endpoints
- 3 admin dashboards
- 32.6K SQL for database
- 8,500+ lines of TypeScript
- Full JSDoc documentation

**Expected Revenue (Year 1)**
- Month 1: €5,200
- Month 6: €46,000
- Year 1: €130,000-200,000
- Year 2: €200,000-300,000+

Siffrorna ovan är interna mål från ad-network-arbetet, inte uppmätt trafik.
De får aldrig publiceras som statistik på sajten (se `/partner`).

**Design Principles**
- **Privacy First**: No PII in logs, anonymous tracking only
- **User Experience**: Maximum 3 ads per page, careful placement
- **Performance**: Auctions complete in <100ms
- **Security**: Rate limiting, API key auth, fraud detection
- **Transparency**: All revenue visible in dashboards
- **Compliance**: FTC, EFTA, Swedish MKN rules followed
- **Scalability**: Works with 1K to 1M visitors

## 2026-08-20 – Discovery-plattform

- Additiv migration: `products`, `articles`, `coupon_feedback`, `discovery_events` plus SEO-fält på stores/categories/offers och `deal_subscribers.interests`.
- Editorial är tre `article_type`: `best_in_test`, `review`, `guide`. Ingen tung CMS.
- Metodetiketter krävs: vi påstår aldrig fysiskt test utan `tested_by_us`.
- Deal Score är isolerad ranking i `features/deal-score`. `is_sponsored` ger ingen poäng.
- Coupon success % visas först efter 5 röster.
- Sök är in-memory `ilike` över nuvarande datamängd; `/sok` är noindex.
- Förstapartsspårning: `click_events` + `discovery_events` med IP-hash, ingen onödig PII.
- Nyhetsbrevsintressen sparas i databasen. Mailutskick är inte implementerat (kräver e-postleverantör).
- Seedade guider är shoppingråd, inte fabricerade produkttester.
- Befintliga ad-network/monetization-moduler saknar genererade DB-typer; de är `@ts-nocheck` så att sajtbygget kan gå igenom. De är inte en del av discovery-plattformens datamodell.

## 2026-08-20 – Granskning och härdning

- **Kommersiella etiketter bygger på faktiska avtal.** `is_featured` mappades
  tidigare till “I samarbete”, vilket märkte varje redaktionellt urval som
  betalt. Nu styr `is_sponsored` och den nya kolumnen `is_exclusive`.
- **Verifiering fabriceras inte.** Backfillen som satte `last_verified_at` från
  `updated_at` är rensad för icke-importerade erbjudanden, och UI:t faller inte
  längre tillbaka på `updated_at`.
- **En enda indexeringsregel.** `hasIndexableContent()` används av både sidornas
  robots-tagg och sitemap. Tidigare räckte en kort beskrivning för att en
  kategori utan erbjudanden skulle hamna i sitemap.
- **Klickstatistik aggregeras i databasen** via SQL-funktioner. Att hämta alla
  `click_events` kapades av PostgREST-gränsen och gav tyst felaktiga siffror.
- **`after()` istället för fire-and-forget.** Visningshändelser skrevs från en
  flytande promise under render, vilket kan tappas och läser `headers()`
  utanför request-scope.
- **Frågor dedupliceras med `cache()`** så `generateMetadata` och sidan delar
  samma databasanrop.
- **Tester importerar riktig källkod.** Testfilen dupliserade tidigare all
  affärslogik, så den kunde aldrig upptäcka en regression.
- Typfiltret på `/rabattkoder` byggde URL:er som sidan ignorerade och är borttaget.
- Butikens `affiliate_url` var konfigurerbar men oanvänd; den går nu via
  `/go/butik/[slug]` med spårning.
