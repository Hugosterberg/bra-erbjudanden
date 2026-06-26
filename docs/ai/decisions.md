# AI-beslut och antaganden

Dokumentera viktiga beslut här när AI:n gör antaganden.

## Initiala beslut

- Kod och mappar namnges på engelska.
- UI och produktcopy skrivs på svenska.
- Next.js App Router används.
- Supabase används för databas och admin-auth.
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
- Admin skyddas server-side via Supabase Auth plus `admin_profiles`. Middleware/proxy används inte som enda auth-lager.
