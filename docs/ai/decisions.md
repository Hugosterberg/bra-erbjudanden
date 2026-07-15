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
