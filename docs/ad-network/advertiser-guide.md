# Annonsörs Guide — Hur Du Köper Reklam på braerbjudanden.se

**För annonsörer som vill nå svenska konsumenter på vår sajt.**

---

## Registrera Dig (5 minuter)

### 1. Skicka ansökan

```bash
curl -X POST https://braerbjudanden.se/api/advertisers/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Nike Sweden",
    "contactEmail": "marketing@nike.se",
    "contactPhone": "+46812345678",
    "websiteUrl": "https://nike.se",
    "country": "SE"
  }'
```

**Svar:**
```json
{
  "success": true,
  "advertiserId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Din ansökan har skickats. Vi granskar och kontaktar dig inom 24 timmar med API-nycklar."
}
```

### 2. Vänta på godkännande

Vi granskar din ansökan och maila dig API-nycklarna när du är godkänd:
- `api_key` — för att autentisera requests
- `api_secret` — för framtida webhook-verifiering

---

## Skapa Din Första Kampanj

### Steg 1: Planera Kampanjen

Bestäm:
- **Vad**: Vilken produkt/erbjudande vill du annonsera?
- **När**: Start- och slut-datum
- **Var**: Homepage? Kategorisidor?
- **Vem**: Sverige-bred? Specifika kategorier?
- **Budget**: Hur mycket per dag/totalt?
- **Format**: Banner, text, bild?

### Steg 2: Skapa Kampanj via API

```bash
curl -X POST https://braerbjudanden.se/api/advertisers/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_xyz123...",
    "name": "Summer Sale 2026",
    "description": "Allt till 50% rabatt under sommaren",
    "targetUrl": "https://nike.se/summer",
    "campaignType": "banner",
    "pricingModel": "cpm",
    "bidAmount": 0.50,
    "currency": "SEK",
    "startsAt": "2026-08-15T00:00:00Z",
    "endsAt": "2026-08-31T23:59:59Z",
    "dailyBudget": 100,
    "totalBudget": 2500,
    "targetCategories": ["sport", "shoes", "fashion"],
    "targetRegions": ["SE"]
  }'
```

**Svar:**
```json
{
  "success": true,
  "campaignId": "campaign_xyz...",
  "status": "pending_approval",
  "message": "Kampanjen skapades. Väntar på godkännande från redaktionen. Vi mailar när den är live."
}
```

### Steg 3: Ladda Up Kreativ (Bild/Text)

Gör detta på annonsördashboarden eller via API:

**Option A: Bild**
```bash
curl -X POST https://braerbjudanden.se/api/advertisers/campaigns/campaign_xyz/creatives \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_xyz...",
    "name": "Banner Hero",
    "creativeType": "image",
    "imageUrl": "https://yourcdn.com/summer-banner-728x90.png",
    "imageAltText": "50% rabatt på sommarskor",
    "width": 728,
    "height": 90
  }'
```

**Option B: Text**
```bash
curl -X POST https://braerbjudanden.se/api/advertisers/campaigns/campaign_xyz/creatives \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_xyz...",
    "name": "Text Ad",
    "creativeType": "text",
    "headline": "50% på Allt",
    "bodyText": "Denna sommaren är det dags att uppdatera din garderob. Vi erbjuder 50% rabatt på allt.",
    "ctaText": "Handla Nu"
  }'
```

---

## Prismodeller — Vad Kostar Det?

### 1️⃣ CPM (Cost Per Mille)

**Du betalar per 1000 visningar**

```
Ditt bud: 0,50 SEK per 1000 impressions
Din kampanj får: 50,000 visningar
Du betalar: (50,000 / 1,000) × 0,50 = 25 SEK
```

**Bra för:** Varumärken som vill synas
**Risk:** Låg (du vet kostnaden)

### 2️⃣ CPC (Cost Per Click)

**Du betalar bara när någon klickar**

```
Ditt bud: 1,50 SEK per klick
Din kampanj får: 1,500 klick
Du betalar: 1,500 × 1,50 = 2,250 SEK
```

**Bra för:** Performance-fokuserade kampanjer
**Risk:** Kan bli dyr om CLick-through rate är hög

### 3️⃣ Daily Flat

**Fast pris per dag**

```
Ditt bud: 500 SEK per dag
Din kampanj kör: 30 dagar
Du betalar: 500 × 30 = 15,000 SEK
```

**Bra för:** Förutsägbar budget
**Risk:** Låg

---

## Placements — Var Visas Din Annons?

| Plats | Storlek | Floor CPM | Best For |
|-------|---------|-----------|----------|
| **Startsida banner** | 728×90 px | 0,30 SEK | Brands, awareness |
| **Startsida sidebar** | 300×250 px | 0,40 SEK | Targeted products |
| **Kategori hero** | 1200×300 px | 0,50 SEK | Category-specific |
| **Sidebar vertikal** | 300×600 px | 0,35 SEK | Long engagement |
| **Footer banner** | 970×90 px | 0,25 SEK | Footer awareness |

**Highest bidder wins** = Din plats bestäms av ditt bud.

Budda högre för att få plats.

---

## Se Din Performance

```bash
curl -X GET "https://braerbjudanden.se/api/advertisers/campaigns/campaign_xyz/analytics?from=2026-08-15&to=2026-08-31" \
  -H "Authorization: Bearer sk_live_xyz..."
```

**Svar:**
```json
{
  "campaignId": "campaign_xyz",
  "period": {
    "from": "2026-08-15",
    "to": "2026-08-31"
  },
  "metrics": {
    "totalImpressions": 125000,
    "totalClicks": 6250,
    "totalSpend": 62.50,
    "ctr": 5.0,
    "cpc": 0.01,
    "cpm": 0.50,
    "averagePositionRank": 3
  },
  "byDay": [
    {
      "date": "2026-08-15",
      "impressions": 5000,
      "clicks": 250,
      "spend": 2.50
    },
    // ... more days
  ]
}
```

**Din instrumentpanel visar:**
- ✅ Impressions (visningar)
- ✅ Clicks (klick)
- ✅ CTR (click-through rate %)
- ✅ Spend (vad du betalt)
- ✅ CPC/CPM (effektivitet)

---

## Pausa Eller Avsluta Kampanj

### Pausa (kampanjen slutar att visas, men kan återstartas)

```bash
curl -X PUT https://braerbjudanden.se/api/advertisers/campaigns/campaign_xyz/pause \
  -H "Authorization: Bearer sk_live_xyz..."
```

### Återuppta

```bash
curl -X PUT https://braerbjudanden.se/api/advertisers/campaigns/campaign_xyz/resume \
  -H "Authorization: Bearer sk_live_xyz..."
```

### Avsluta (permanent)

Kampanjen avslutas automatiskt när `endsAt` passeras. Kan inte återstartas.

---

## Fakturering

### Månadsfaktura

Du får fakturerad varje månad för:
- Total spend (impressions × CPM eller klick × CPC)
- Start och slut datum

**Exempel månadsfaktura:**
```
Kampanj: Summer Sale 2026
Period: 2026-08-01 till 2026-08-31
Total impressions: 1,250,000
CPM: 0,50 SEK
Total spend: 625 SEK
```

### Betalningsmetoder

- 💳 **Kreditkort** (Stripe) — instant
- 🏦 **Banköverföring** — 5-7 arbetsdagar
- 📄 **Faktura** — 30 dagars betalningsvillkor (för >5000 SEK/månad)

---

## Best Practices

### 1. **Testa Först (Låg Budget)**
```
Starta med 100-200 SEK/dag
Se vilka placements som fungerar bäst
Skala upp högre bud när du ser resultat
```

### 2. **Använd Bra Bilder**
- Minst 300×250 px (högre resolution)
- Färgglad, tydlig text
- Säg vad anbudet gäller ("50% Off", "Free Shipping")

### 3. **Tydliga Call-To-Actions**
- "Handla Nu"
- "Se Erbjudandet"
- "Läs Mer"

### 4. **Relevanta Länka**
- Landing page måste matcha annonsen
- Om annonsen säger "Sommarskor", link till sommarskor
- Dålig relevans = lågt CTR = dyrt

### 5. **Monitoring**
- Kolla dina metrics varje vecka
- Om CTR < 1%, prova ny bild
- Om CPC > 10 SEK, bud lägre eller skrota kampanjen

---

## Vanliga Frågor

**F: Hur lång tid tar det att bli godkänd?**  
S: Normalt 24 timmar. Vi granskar din ansökan och mailar API-nycklarna.

**F: Vad kostar det minst?**  
S: 500 SEK. Minimum campaign budget för att det ska löna sig för båda.

**F: Kan jag ändra mitt bud efter lansering?**  
S: Ja! Via API eller dashboard kan du uppdatera bid_amount närsomhelst.

**F: Vad händer om jag överskrider mitt budget?**  
S: Kampanjen pausas automatiskt när budgetgränsen nås. Mailar dig notification.

**F: Kan jag få rabatt för långtidskampanjer?**  
S: Ja! För >50,000 SEK spend/månad kan vi diskutera volymrabatt. Maila ads@braerbjudanden.se

**F: Vad om min annons inte följer reglerna?**  
S: Vi avslår den. Du får ett mail med anledning. Du kan uppdatera och skicka igen.

**F: Kan jag annonsera för konkurrenter?**  
S: Ja! Solange deras produkter är relevanta för våra besökare.

**F: Vilka länder kan jag annonsera från?**  
S: Vi godkänner annonsörer från EU. Andra länder på förfrågan.

---

## Support & Kontakt

**Mailadress:** ads@braerbjudanden.se  
**Svar på:** Vardagar 9-17 CET  
**Telefon:** +46 XXXX XXXXX (endast för större annonsörer)

---

## Kom Igång Nu

1. **Registrera dig:** POST `/api/advertisers/register`
2. **Vänta på godkännande** (max 24h)
3. **Få API-nycklarna** via mail
4. **Skapa en kampanj** via API
5. **Vänta på godkännande** av redaktionen
6. **Din annons är live!** — Börjar tjäna rätt av

**Lycka Till! 🚀**
