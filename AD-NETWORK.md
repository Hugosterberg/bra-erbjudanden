# Ad Network — Complete Implementation

**Status:** ✅ Foundation Complete  
**Date:** 2026-08-08  
**Ready for:** Integration Phase

---

## TL;DR

Du kan nu **ta betalt från andra företag för att annonsera på braerbjudanden.se**. Det är ett helt nytt revenue stream bredvid affiliate links.

**Revenue:** 20% platform fee × advertiser spend
- Om Nike betalar 1000 kr/månad → Du tjänar 200 kr (80 kr till dem)

---

## What's Ready

### 1. Database Schema ✅
Migration: `20260808130000_ad_network_foundation.sql`

**Tables:**
- `advertiser_accounts` — Annonsörer som registrerat sig
- `ad_campaigns` — Kampanjer (banner, text, image, HTML)
- `ad_creatives` — Visuell assets (bilder, video, HTML)
- `ad_placements` — Platser på sajten (homepage, sidebar, etc)
- `ad_impressions` — Varje gång en annons visas
- `ad_clicks` — Varje gång användare klickar
- `ad_metrics_daily` — Aggregerad data per dag
- `advertiser_payouts` — Fakturering & betalningar

**Run migration:**
```bash
supabase migration up
```

### 2. API Endpoints ✅

**For Advertisers:**
- `POST /api/advertisers/register` — Register as advertiser
- `POST /api/advertisers/campaigns` — Create campaign

**For Admin:**
- `GET /admin/annonser` — Manage campaigns, approve, see revenue

### 3. TypeScript Types & Queries ✅

**Files:**
- `src/features/ad-network/types.ts` — 15 types (AdvertiserAccount, AdCampaign, etc)
- `src/features/ad-network/queries.ts` — 8 read-only queries
- `src/features/ad-network/actions.ts` — Create, approve, update campaigns

### 4. Components ✅

**`<AdBanner />`** — Show ad on page
```typescript
<AdBanner 
  campaign={campaign}
  creative={creative}
  placement={placement}
  sessionId={sessionId}
/>
```
- Automatically logs impression
- Automatically logs click
- Supports image, text, HTML, video

### 5. Admin Panel ✅

**URL:** `/admin/annonser`

**Features:**
- View pending campaigns (awaiting approval)
- Approve/reject campaigns
- View active campaigns
- Pause/resume
- See today's revenue
- Advertiser management

### 6. Documentation ✅

- `docs/ad-network/overview.md` — Full technical spec
- `docs/ad-network/advertiser-guide.md` — Guide for advertisers

---

## How It Works

### Advertiser Journey

1. **Register** — Company submits via `/api/advertisers/register`
2. **Admin Approval** — You review & approve in `/admin/annonser`
3. **Create Campaign** — Advertiser creates campaign via API
4. **Admin Approval** — You review creatives & approve
5. **Live** — Campaign starts showing on your site
6. **Monthly Billing** — You invoice them for impressions/clicks
7. **Payout** — They pay via Stripe or bank transfer

### User Journey

1. User visits braerbjudanden.se
2. `<AdBanner />` component renders (random highest-bidder)
3. Impression logged to `ad_impressions`
4. User sees ad, may click
5. Click logged to `ad_clicks`
6. User goes to advertiser's website
7. System aggregates metrics daily

---

## Revenue Model

### 20% Platform Fee

**You keep 80%** of advertiser spend.

**Example:**
```
Nike's campaign: CPM 0,50 SEK per 1000 impressions
Campaign gets: 100,000 impressions
Nike pays: (100,000 / 1,000) × 0,50 = 50 SEK
You earn: 50 × 0,80 = 40 SEK
Platform fee: 50 × 0,20 = 10 SEK
```

### Pricing Models

**CPM** — Cost Per Mille (per 1000 impressions)
- Nike bids 0,50 SEK/1000 impressions
- Standard for brand awareness

**CPC** — Cost Per Click
- Nike bids 2,00 SEK per click
- Only pay when user clicks
- Higher risk for advertiser

**Daily Flat** — Fixed daily rate
- Nike pays 500 SEK/day for 30 days
- Predictable for both sides

---

## Code Locations

**Database:**
- Migration: `supabase/migrations/20260808130000_ad_network_foundation.sql`

**Features:**
- Types: `src/features/ad-network/types.ts`
- Queries: `src/features/ad-network/queries.ts`
- Actions: `src/features/ad-network/actions.ts`

**API:**
- Register: `src/app/api/advertisers/register/route.ts`
- Create campaign: `src/app/api/advertisers/campaigns/route.ts`

**Pages:**
- Admin: `src/app/admin/annonser/page.tsx`

**Components:**
- Ad Banner: `src/features/ad-network/components/ad-banner.tsx`

**Navigation:**
- Updated: `src/features/admin/components/admin-shell.tsx` (added "Annonser" link)

---

## Testing Advertiser Registration

### 1. Register

```bash
curl -X POST http://localhost:3000/api/advertisers/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Nike Sweden",
    "contactEmail": "ads@nike.se",
    "contactPhone": "+46812345678",
    "websiteUrl": "https://nike.se",
    "country": "SE"
  }'
```

Response:
```json
{
  "success": true,
  "advertiserId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Application submitted..."
}
```

### 2. Approve Advertiser (Admin)

In Supabase Dashboard:
```sql
UPDATE advertiser_accounts 
SET status = 'approved', verified_at = now()
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### 3. Get API Key

In Supabase:
```sql
SELECT api_key, api_secret 
FROM advertiser_accounts 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### 4. Create Campaign

```bash
curl -X POST http://localhost:3000/api/advertisers/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "name": "Summer Sale",
    "targetUrl": "https://nike.se/summer",
    "campaignType": "banner",
    "pricingModel": "cpm",
    "bidAmount": 0.50,
    "startsAt": "2026-08-15T00:00:00Z",
    "endsAt": "2026-08-31T23:59:59Z",
    "dailyBudget": 100,
    "totalBudget": 2500
  }'
```

### 5. Check Admin Panel

Go to `/admin/annonser` → Should see campaign awaiting approval

### 6. Approve Campaign (Admin)

Click "Godkänn" button

### 7. Add to Page

```typescript
// In a Server Component
import { AdBanner } from '@/features/ad-network/components/ad-banner';
import { 
  findCampaignsByPlacement, 
  findCreativesByCampaign 
} from '@/features/ad-network/queries';

const campaigns = await findCampaignsByPlacement('homepage-banner-placement-id');
const campaign = campaigns[0]; // Highest bidder
const creatives = await findCreativesByCampaign(campaign.id);
const creative = creatives[0];

return <AdBanner campaign={campaign} creative={creative} placement={placement} />;
```

---

## Integration Roadmap

### Phase 1: Foundation (COMPLETE) ✅
- [x] Database schema
- [x] TypeScript types
- [x] API endpoints
- [x] Admin panel
- [x] Ad Banner component
- [x] Documentation

### Phase 2: Ad Serving (READY)
- [ ] Add `<AdBanner />` to homepage
- [ ] Add to category pages
- [ ] Add to sidebar (multiple placements)
- [ ] Verify impressions/clicks logged

### Phase 3: Advertiser Dashboard (READY)
- [ ] Build analytics endpoints
- [ ] Show performance to advertisers
- [ ] Allow budget management
- [ ] Campaign pause/resume

### Phase 4: Billing (READY)
- [ ] Integrate Stripe for cards
- [ ] Monthly invoice generation
- [ ] Payout calculation
- [ ] Payment reconciliation

### Phase 5: Advanced (READY)
- [ ] A/B testing creatives
- [ ] Real-time analytics
- [ ] Fraud detection
- [ ] Automated optimization

---

## Key Features

✅ **Multiple Pricing Models**
- CPM (impressions)
- CPC (clicks)
- Daily flat rate

✅ **Ad Format Support**
- Images (PNG, JPG, WebP)
- Text (headline + body)
- HTML (custom)
- Video (future)

✅ **Targeting**
- By category (e.g., "sport", "shoes")
- By region (SE, NO, DK)
- By placement type

✅ **Capacity Management**
- Max daily impressions per placement
- Highest bidder gets placement
- Budget enforcement

✅ **Audit Trail**
- All creatives reviewed by admin
- All campaigns approved before launch
- Full metrics tracking

✅ **Security**
- API key authentication
- No cross-advertiser data leakage
- Click fraud detection (future)

---

## Admin Workflow

1. **Annonsör registrerar sig**
   - Email din team@braerbjudanden.se
   - Status: `pending`

2. **Du granskar ansökan**
   - Kolla: legitimt företag? Valid email?
   - Go to Supabase → `advertiser_accounts`
   - Set status = `approved`

3. **Annonsör skapar kampanj**
   - De skickar API request
   - Campaign appears in `/admin/annonser`
   - Status: `pending_approval`

4. **Du godkänner kampanj**
   - Check: bild ser OK ut?
   - Link går till rätt plats?
   - Relevant för publikum?
   - Click "Godkänn" button

5. **Kampanjen är live**
   - Status: `active`
   - Börjar visas på sajten
   - Metrics loggas automatiskt

6. **Månad slutar**
   - System beräknar total spend
   - Skapar invoice för annonsör
   - Din intäkt = 20% av totalt spend

---

## Success Metrics

**Month 1:**
- 5+ advertisers registered
- 10+ active campaigns
- 100,000+ impressions
- $50-100 monthly revenue

**Month 3:**
- 30+ advertisers
- 50+ active campaigns
- 10M+ impressions
- $1,000-2,000 monthly revenue

**Month 6:**
- 100+ advertisers
- Placements 80% full
- 100M+ impressions
- $10,000+ monthly revenue

---

## Next Immediate Actions

1. **Run migration:**
   ```bash
   supabase migration up
   ```

2. **Test registration API:**
   - POST to `/api/advertisers/register`
   - Check advertiser appears in Supabase

3. **Test admin panel:**
   - Visit `/admin/annonser`
   - Should load without errors

4. **Approve test advertiser:**
   - In Supabase, set status = `approved`
   - Check API key appears

5. **Create test campaign:**
   - Use API to create campaign
   - Verify in `/admin/annonser`

6. **Add `<AdBanner />` to homepage:**
   - Import component
   - Query placement & campaigns
   - Render ad
   - Check impressions logged

---

## Support

**Full docs:**
- Technical spec: `docs/ad-network/overview.md`
- Advertiser guide: `docs/ad-network/advertiser-guide.md`

**Code examples:**
- Registration: `src/app/api/advertisers/register/route.ts`
- Campaigns: `src/app/api/advertisers/campaigns/route.ts`
- Component: `src/features/ad-network/components/ad-banner.tsx`

---

## Questions?

**For implementation:** Check docs  
**For API issues:** Review query functions  
**For UI:** Check component props

---

**Status: Ready to integrate! Start with Phase 2 (Ad Serving).** 🚀
