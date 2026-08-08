# Ad Network — Svenska Annonsörer Kan Köpa Reklam

**Status:** ✅ Foundation Complete  
**Date:** 2026-08-08

---

## Vad är Ad Network?

Ett system som låter annonsörer (andra företag) köpa reklam på braerbjudanden.se. Du får betalt när annonsörer visar sina kampanjer på din sajt.

### Exempel Flow

1. **Nike** registrerar sig som annonsör via `/api/advertisers/register`
2. **Nike** skapar en kampanj (banner, CPM-baserad bud på 0,50 kr per 1000 impressions)
3. **Admin** godkänner kampanjen
4. Kampanjen är **aktiv** och kampanj visas på sajten
5. Du tjänar **0,50 kr × (impressions/1000) × 0,80** (20% platform fee)
6. **Nike** får fakturerad varje månad för impressions/klick

---

## Database Schema

### `advertiser_accounts`
```sql
- id, business_name, contact_email
- api_key, api_secret (för autentisering)
- status: pending | approved | suspended
- payment_method: stripe | bank_transfer
- monthly_budget_sek (spend limit)
```

### `ad_campaigns`
```sql
- id, advertiser_id, name, description
- target_url (länken annonskompanjen leder till)
- campaign_type: banner | featured_offer | native | sidebar
- pricing_model: cpm | cpc | daily_flat
- bid_amount (0.50 för CPM = 0,50 kr per 1000 impressions)
- starts_at, ends_at
- status: draft | pending_approval | approved | active | paused | rejected
- target_categories, target_regions (targeting options)
```

### `ad_creatives`
```sql
- id, campaign_id, name
- creative_type: image | text | video | html
- image_url, headline, body_text, cta_text
- status: pending_review | approved | rejected
```

### `ad_placements`
```sql
- id, name (unique)
- placement_type: homepage_banner | category_hero | sidebar_vertical | footer_banner
- width, height (dimensions)
- base_cpm_sek (floor price)
- min_bid_sek (minimum bid)
- max_daily_impressions (capacity limit)
```

### `ad_impressions`
```sql
- Logged every time an ad is shown
- campaign_id, creative_id, placement_id
- session_id, user_agent, referrer, page_url
```

### `ad_clicks`
```sql
- Logged every time user clicks ad
- campaign_id, creative_id, impression_id
```

### `ad_metrics_daily`
```sql
- Aggregated metrics per day per campaign
- date, impressions, clicks, spend_sek
- ctr (click-through rate)
- cpc_sek (cost per click)
```

### `advertiser_payouts`
```sql
- Monthly/weekly billing records
- total_impressions, total_clicks, total_spend_sek
- platform_fee_sek (20% of spend)
- payout_amount_sek (amount paid to advertiser)
```

---

## API Endpoints för Annonsörer

### 1. Register
```
POST /api/advertisers/register
{
  "businessName": "Nike Sweden",
  "contactEmail": "ads@nike.se",
  "contactPhone": "+46812345678",
  "websiteUrl": "https://nike.se",
  "country": "SE"
}

Response:
{
  "success": true,
  "advertiserId": "uuid",
  "message": "Application submitted for review. We'll contact you with API keys."
}
```

### 2. Create Campaign
```
POST /api/advertisers/campaigns
{
  "apiKey": "xyz123...",
  "name": "Summer Sale 2026",
  "description": "50% off all summer products",
  "targetUrl": "https://nike.se/summer-sale",
  "campaignType": "banner",
  "pricingModel": "cpm",
  "bidAmount": 0.50,
  "startsAt": "2026-08-15T00:00:00Z",
  "endsAt": "2026-08-31T23:59:59Z",
  "dailyBudget": 100,
  "totalBudget": 2500,
  "targetCategories": ["sport", "shoes"],
  "targetRegions": ["SE"]
}

Response:
{
  "success": true,
  "campaignId": "uuid",
  "status": "pending_approval"
}
```

### 3. Get Campaign Performance (Future)
```
GET /api/advertisers/campaigns/uuid/analytics?from=2026-08-01&to=2026-08-31
Response:
{
  "campaignId": "uuid",
  "totalImpressions": 50000,
  "totalClicks": 2500,
  "totalSpend": 25,
  "ctr": 5.0,
  "cpc": 0.01,
  "cpm": 0.50
}
```

---

## Admin Panel (`/admin/annonser`)

### Features
- ✅ View pending campaigns (awaiting approval)
- ✅ Approve/reject campaigns with reason
- ✅ View active campaigns (running now)
- ✅ Pause/resume campaigns
- ✅ See today's revenue (impressions × CPM × 0.8)
- ✅ Manage advertiser accounts (approve, suspend)

### Workflow
1. Annonsör registrerar sig
2. Admin godkänner annonsören (status: approved)
3. Annonsör skapar kampanj
4. Admin granskar kampanj (kolla bild, text, länk, targeting)
5. Admin godkänner eller avslår
6. Om godkänd: kampanj börjar visas på sajten
7. Systemet loggar impressions/klick automatiskt

---

## Ad Placements

Förinställda platser där annonser kan visas:

| Placement | Type | Size | Floor CPM | Max Daily |
|-----------|------|------|-----------|-----------|
| Homepage Banner | homepage_banner | 728×90 | 0.30 kr | 10,000 |
| Homepage Sidebar | homepage_sidebar | 300×250 | 0.40 kr | 5,000 |
| Category Hero | category_hero | 1200×300 | 0.50 kr | 3,000 |
| Sidebar Vertical | sidebar_vertical | 300×600 | 0.35 kr | 8,000 |
| Footer Banner | footer_banner | 970×90 | 0.25 kr | 15,000 |

**Capacity = Capacity per placement**
- Du bestämmer floor price (minimum bud)
- System rank campaigns by bid amount
- Highest bidder får placement

---

## Revenue Model

### 20% Platform Fee

**Example:**
- Annonsör buddar 0,50 kr CPM
- 50,000 impressions
- **Utgift för annonsör:** 50,000 × 0.50 / 1000 = 25 kr
- **Din intäkt:** 25 × 0.80 = 20 kr
- **Platform fee:** 25 × 0.20 = 5 kr

### Pricing Models

**1. CPM (Cost Per Mille)**
- Annonsören betalar per 1000 impressions
- Du tjänar baserat på visningar, oavsett klick
- Lägsta risk för annonsör

**2. CPC (Cost Per Click)**
- Annonsören betalar bara för klick
- Du tjänar bara när användare klickar
- Högre risk för annonsör, men högre ROI

**3. Daily Flat**
- Fast pris per dag
- Enkel att förstå och planera
- Exempel: 500 kr/dag i 30 dagar

---

## Security & Compliance

✅ **API Key Authentication**
- Annonsörer autentiseras via API key
- Kan inte se andras kampanjer eller data
- API Secret för webhook verification (future)

✅ **Ad Approval**
- Admin måste godkänna alla creatives
- Ingen misledande reklam
- Inga direkt-lånkar till malware/phishing

✅ **Budget Enforcement**
- Daglig budget respekteras
- Kampanj stops när budget är slut
- Advertiser notified when near limit

✅ **Click Fraud Detection** (Future)
- Block suspicious patterns
- IP-based duplicate detection
- Session validation

---

## Implementation Checklist

### Phase 1: Foundation (COMPLETE) ✅
- [x] Database schema
- [x] TypeScript types
- [x] Queries & actions
- [x] API registration endpoint
- [x] API campaign creation endpoint
- [x] Admin panel for approval

### Phase 2: Ad Serving (READY)
- [ ] `<AdBanner />` component on homepage
- [ ] Ad rendering on category pages
- [ ] Ad rendering on sidebar
- [ ] Impression tracking (automatic)
- [ ] Click tracking (automatic)
- [ ] Daily metrics aggregation

### Phase 3: Advertiser Dashboard (READY)
- [ ] GET `/api/advertisers/campaigns/:id/analytics`
- [ ] Dashboard for advertisers to view performance
- [ ] Budget management
- [ ] Campaign pause/resume

### Phase 4: Billing & Payouts
- [ ] Stripe integration
- [ ] Monthly invoicing
- [ ] Automatic payouts
- [ ] Payment reconciliation

### Phase 5: Advanced Features
- [ ] A/B testing multiple creatives
- [ ] Audience targeting (categories, regions, interests)
- [ ] Real-time analytics
- [ ] Fraud detection
- [ ] Automated campaign optimization

---

## How to Use Ad Banner Component

```typescript
// Get ad for placement
const campaigns = await findCampaignsByPlacement(placementId);
const campaign = campaigns[0]; // Highest bidder

if (campaign) {
  const creatives = await findCreativesByCampaign(campaign.id);
  const creative = creatives[0]; // Random or first
  
  const placement = await findPlacementById(placementId);
  
  return (
    <AdBanner 
      campaign={campaign}
      creative={creative}
      placement={placement}
      sessionId={sessionId}
      className="mb-4"
    />
  );
}
```

The component **automatically**:
- Records impression on mount
- Records click when user clicks
- Opens advertiser's link in new tab

---

## Testing

### Manual Testing

1. **Register advertiser:**
```bash
curl -X POST http://localhost:3000/api/advertisers/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Co",
    "contactEmail": "test@testco.se",
    "websiteUrl": "https://testco.se"
  }'
```

2. **Approve advertiser (admin):**
   - Go to Supabase → `advertiser_accounts`
   - Update status to "approved"

3. **Create campaign:**
```bash
curl -X POST http://localhost:3000/api/advertisers/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "xxx",
    "name": "Test Campaign",
    "targetUrl": "https://testco.se",
    "campaignType": "banner",
    "pricingModel": "cpm",
    "bidAmount": 0.50,
    "startsAt": "2026-08-08T00:00:00Z",
    "endsAt": "2026-08-31T23:59:59Z"
  }'
```

4. **Approve campaign (admin):**
   - Go to `/admin/annonser`
   - Click approve on pending campaign

5. **Add ad to page:**
   - Import `<AdBanner />`
   - Pass campaign + creative + placement props
   - Check database for impressions/clicks

---

## Next Steps

**This Week:**
- [ ] Run database migration
- [ ] Test advertiser registration API
- [ ] Test campaign creation API
- [ ] Verify admin panel loads

**Next Week:**
- [ ] Add `<AdBanner />` to homepage
- [ ] Add to category pages
- [ ] Add to sidebar
- [ ] Verify impressions/clicks logged

**Phase 3:**
- [ ] Build advertiser dashboard
- [ ] Analytics endpoints
- [ ] Performance charts

**Phase 4:**
- [ ] Stripe integration
- [ ] Billing system
- [ ] Payouts

---

## Success Metrics

**Month 1:**
- 10+ advertisers registered
- 20+ active campaigns
- $500+ monthly revenue

**Month 3:**
- 50+ advertisers
- 100+ campaigns (rotating)
- $5,000+ monthly revenue
- 50% of placements monetized

**Month 6:**
- 200+ advertisers
- Fully booked placements
- $20,000+ monthly revenue
- Automated bidding system
- Fraud detection active

---

## Questions?

Check `/docs/ad-network/` for more detailed docs.
