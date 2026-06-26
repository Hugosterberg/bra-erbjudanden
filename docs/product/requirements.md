# Krav

## Funktionella krav

### Erbjudanden

Ett erbjudande ska kunna ha:

- Titel
- Kort beskrivning
- Butik
- Kategori
- Rabattkod, om sådan finns
- Affiliatelänk eller extern länk
- Rabattvärde
- Rabatttyp: procent eller fast belopp
- Startdatum
- Slutdatum
- Status: draft, published, archived
- Manuell ranking
- Klickräknare/statistik
- Utvald-markering

### Ranking

Admin ska kunna styra ordningen manuellt. Lägre eller högre rankingvärde ska konsekvent avgöra sortering. Välj en modell och dokumentera den.

Rekommenderat: lägre `rank_position` visas högre upp.

### Klickmätning

Varje klick på ett erbjudande ska registreras innan användaren skickas vidare.

Spara minst:

- Offer id
- Store id, om tillgängligt
- Timestamp
- Referrer, om tillgängligt
- User agent, om rimligt
- IP hash, endast om det görs integritetsmedvetet

Visa enkel klickstatistik i admin.

### Admin

Admin ska kunna:

- Logga in
- Skapa erbjudanden
- Redigera erbjudanden
- Publicera/arkivera erbjudanden
- Ändra ranking
- Se klick per erbjudande

## Icke-funktionella krav

- Snabb laddning
- SEO-vänligt
- Mobil först
- Tillgängligt gränssnitt
- Tydlig felhantering
- Säker hantering av admin
- Ingen känsla av spam eller lågkvalitativ rabattkodssida
