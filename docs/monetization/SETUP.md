# Monetization Setup — Swedish Affiliate Integration

**Date:** 2026-08-08  
**Status:** Foundation Complete ✅  
**Branch:** feature/affiliate-import

---

## What's Ready

### 1. Database Schema ✅

**Migration:** `20260808120000_monetization_foundation.sql`

Tables created:
- `affiliate_revenue_events` — Every impression, click, conversion
- `affiliate_revenue_daily` — Aggregated daily metrics per network
- `sponsorships` — Premium offer placements
- `sponsorship_events` — Sponsorship impression/click tracking
- `affiliate_disclosure_settings` — Site-wide disclosure configuration
- `affiliate_network_config` — Per-network settings (commission rates, etc.)

All tables have:
- Row-level security enabled
- Appropriate indexes for query performance
- Foreign key constraints for data integrity

**Next Step:** Run migration on Supabase

```bash
# If using Supabase CLI
supabase migration up

# Or manually apply SQL in Supabase Dashboard
```

---

### 2. TypeScript Types & Schemas ✅

**Files:**
- `src/features/monetization/types.ts` — 12 core types (RevenueEventType, Sponsorship, etc.)
- `src/features/monetization/schemas.ts` — Zod validation for sponsor creation/updates

**Usage:**
```typescript
import type { Sponsorship, RevenueMetrics } from '@/features/monetization';
import { createSponsorshipSchema } from '@/features/monetization';
```

---

### 3. Server-Side Queries ✅

**File:** `src/features/monetization/queries.ts`

Functions (all read-only):
- `findRevenueEventsByDateRange()` — Get raw events
- `findDailyRevenueByNetwork()` — Aggregated metrics
- `findActiveSponsorships()` — Current sponsored offers
- `findAffiliateDisclosureSettings()` — Disclosure config
- `calculateRevenueMetrics()` — Total stats (30-day default)
- `calculateNetworkRevenueMetrics()` — Per-network breakdown with trends
- `findTopRevenueOffers()` — Top 10 by revenue

**Example:**
```typescript
const metrics = await calculateRevenueMetrics(startDate, endDate);
console.log(metrics.totalRevenue); // USD
console.log(metrics.averageCpc);   // USD per click
```

---

### 4. Server Actions ✅

**File:** `src/features/monetization/actions.ts`

Functions (admin only, use service role):
- `recordRevenueEvent()` — Log impression/click/conversion
- `createSponsorship()` — Create premium placement
- `updateSponsorship()` — Pause, resume, update amount
- `pauseSponsorship()` / `resumeSponsorship()` — Toggle status
- `recordSponsorshipEvent()` — Log sponsorship impression/click
- `updateAffiliateDisclosureSettings()` — Configure disclosure text/URLs

**Example:**
```typescript
await recordRevenueEvent({
  offerId: 'offer-123',
  affiliateNetwork: 'awin',
  eventType: 'click',
  revenueUsd: 0.50,
  userAgent: req.headers['user-agent'],
  referrer: req.referrer,
});
```

---

### 5. UI Components ✅

#### `AffiliateDisclosureBadge`

Prominent disclosure on pages. Two modes:

```typescript
// Compact (inline)
<AffiliateDisclosureBadge compact />

// Full (prominent)
<AffiliateDisclosureBadge />
```

**Output:** Blue box explaining how we earn money, with link to policy.

#### `AffiliateLinkLabel`

Small inline badge for offer cards:

```typescript
<AffiliateLinkLabel network="awin" />
```

**Output:** Amber badge with "Affiliate (awin)"

#### `RevenueDashboard`

Admin analytics component:

```typescript
<RevenueDashboard 
  metrics={revenueMetrics} 
  networkMetrics={networkMetricsArray} 
/>
```

**Output:**
- 4 metric cards (revenue, CPC, CPM, conversion %)
- Per-network breakdown with trend indicators
- Responsive grid layout

#### `SponsorshipAdmin`

Sponsorship management interface:

```typescript
<SponsorshipAdmin sponsorships={active} onRefresh={reload} />
```

**Features:**
- List active sponsorships
- Pause/resume/delete buttons
- Reserved position display
- End dates

---

### 6. Admin Pages ✅

#### `/admin/intakter` (Revenue Dashboard)

- **Metrics:** Last 30 days (configurable)
- **Display:** Total revenue, per-network breakdown, trends
- **Data:** Calculated in real-time from events
- **Features:** Network comparison, trend indicators

**How it works:**
```typescript
// Page component
const [metrics, ...networkMetrics] = await Promise.all([
  calculateRevenueMetrics(startDate, endDate),
  ...AFFILIATE_NETWORKS.map(n => calculateNetworkRevenueMetrics(n, ...))
]);

return <RevenueDashboard metrics={metrics} networkMetrics={networkMetrics} />;
```

---

### 7. Public Policy Page ✅

#### `/affiliatedisclosure`

Complete transparency page explaining:
- ✅ What affiliate links are
- ✅ How we use the money
- ✅ Which networks we work with
- ✅ Sponsorship policy
- ✅ Trust guarantees
- ✅ FTC/EFTA compliance

**Language:** Swedish  
**Route:** `/affiliatedisclosure`  
**Includes:** AffiliateDisclosureBadge component

---

### 8. Feature Index ✅

**File:** `src/features/monetization/index.ts`

Central export point. Simplifies imports:

```typescript
// Instead of:
import type { Sponsorship } from '@/features/monetization/types';
import { calculateRevenueMetrics } from '@/features/monetization/queries';
import { recordRevenueEvent } from '@/features/monetization/actions';

// Use:
import type { Sponsorship } from '@/features/monetization';
import { calculateRevenueMetrics, recordRevenueEvent } from '@/features/monetization';
```

---

### 9. Navigation Integration ✅

Admin sidebar now includes:
- `/admin/intakter` — Revenue metrics (TrendingUp icon)

**Updated File:** `src/features/admin/components/admin-shell.tsx`

---

### 10. Documentation ✅

#### `docs/monetization/strategy.md`

High-level monetization strategy:
- What's implemented (5 networks, auto-import, click tracking)
- What's planned (sponsorships, native ads, newsletter monetization)
- Timeline for rollout
- Success metrics

#### `docs/monetization/implementation-guide.md`

Step-by-step integration guide for:
- Phase 1: Revenue event recording (clicks, impressions)
- Phase 2: Revenue determination from APIs
- Phase 3: Sponsorship ranking
- Phase 4: Disclosure badges
- Phase 5: Analytics dashboard
- Testing checklist
- Security considerations

#### `docs/ai/decisions.md`

Updated with 2026-08-08 decisions:
- Revenue tracking schema
- Sponsorship system design
- Privacy-first approach
- Compliance strategy

---

## Integration Checklist

### ✅ Phase 1: Foundation (COMPLETE)

- [x] Database schema created
- [x] Types & validation schemas
- [x] Query functions (read-only)
- [x] Admin actions (create, update)
- [x] UI components for disclosures
- [x] Admin revenue dashboard
- [x] Public affiliate policy page
- [x] Navigation updated

### ⏳ Phase 2: Click/Impression Tracking (READY)

- [ ] Integrate `recordRevenueEvent()` into `/go/[offerId]` route
- [ ] Add impression tracking to `offer-card.tsx` (client-side)
- [ ] Create `/api/cron/aggregate-revenue` for daily aggregation
- [ ] Add cron schedule to vercel.json
- [ ] Test revenue events recorded correctly

### ⏳ Phase 3: Network Revenue APIs (READY)

- [ ] Implement `getRevenueFromAwin()` mapper
- [ ] Implement revenue mappers for Adtraction, Tradedoubler, Adrecord, Addrevenue
- [ ] Parse revenue from API responses or pixels
- [ ] Store non-zero revenue in `recordRevenueEvent()`

### ⏳ Phase 4: Sponsorship Ranking (READY)

- [ ] Update `findPublicOffers()` to honor `reserved_position`
- [ ] Integrate sponsorship lookup in offer card
- [ ] Display sponsorship badge on UI
- [ ] Record sponsorship impression/click events

### ⏳ Phase 5: Analytics & Reporting (READY)

- [ ] Add export-to-CSV feature in `/admin/intakter`
- [ ] Create monthly revenue report template
- [ ] Build trend analysis (YoY, MoM)
- [ ] Dashboard filtering by date range & network

---

## Environment Variables Required

No new environment variables needed to start. Optional for revenue tracking:

```bash
# For Vercel Cron
CRON_SECRET=<your-secret>

# For affiliate network webhooks (future)
AWIN_WEBHOOK_SECRET=<from-awin>
ADTRACTION_WEBHOOK_SECRET=<from-adtraction>
```

---

## Database Cleanup (if needed)

If you need to reset and re-apply the migration:

```bash
# In Supabase Dashboard → SQL Editor, run:
DROP TABLE IF EXISTS affiliate_network_config CASCADE;
DROP TABLE IF EXISTS affiliate_disclosure_settings CASCADE;
DROP TABLE IF EXISTS sponsorship_events CASCADE;
DROP TABLE IF EXISTS sponsorships CASCADE;
DROP TABLE IF EXISTS affiliate_revenue_daily CASCADE;
DROP TABLE IF EXISTS affiliate_revenue_events CASCADE;

-- Then re-apply migration
```

---

## Testing Revenue Tracking

Once Phase 2 is complete:

```bash
# 1. Record a test click event
curl -X POST http://localhost:3000/api/test/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "offer-123",
    "affiliateNetwork": "awin",
    "eventType": "click",
    "revenueUsd": 0.50
  }'

# 2. Check database
SELECT COUNT(*) FROM affiliate_revenue_events;
SELECT * FROM affiliate_revenue_events LIMIT 5;

# 3. Check dashboard
# Visit http://localhost:3000/admin/intakter
```

---

## What's NOT Yet Implemented

### Intentionally Deferred (in next phases):

1. **Automated revenue from network APIs** — Requires active API integrations
2. **Impression tracking at scale** — Needs client-side instrumentation
3. **Conversion tracking** — Requires pixel/webhook setup per network
4. **Advanced analytics** — Trend analysis, ML predictions
5. **Sponsorship bidding** — Automated auction system
6. **Newsletter monetization** — Requires newsletter feature completion
7. **Ad network integration** — Google Adsense, etc.
8. **Multi-currency dashboard** — Currently USD/SEK support only

### Why Deferred:

- Foundation must be tested in production first
- Revenue algorithms should be validated by data, not guesses
- Too many features early = shipping bugs to users
- Sponsorship pricing model needs market research

---

## What's Next?

**Immediate (This Week):**
1. Run database migration: `supabase migration up`
2. Test admin page loads: `/admin/intakter`
3. Verify components render without errors
4. Check affiliate policy page: `/affiliatedisclosure`

**Next Week:**
1. Implement click event recording in `/go/[offerId]`
2. Add impression tracking to offer cards
3. Set up `/api/cron/aggregate-revenue`
4. Test revenue events populate `affiliate_revenue_daily`

**Two Weeks:**
1. Integrate revenue APIs from first network (e.g., Awin)
2. Verify non-zero revenue appears in dashboard
3. Create sponsorship for testing
4. Verify sponsorship ranking works

---

## Support & Questions

For implementation help, refer to:

- **Database & Schema:** `docs/monetization/strategy.md` → "Technical Decisions"
- **Step-by-step:** `docs/monetization/implementation-guide.md`
- **Type safety:** `src/features/monetization/types.ts`
- **Decisions log:** `docs/ai/decisions.md` → "2026-08-08"

For code examples, grep for:
- `recordRevenueEvent` — How to log events
- `calculateRevenueMetrics` — How to query analytics
- `AffiliateLinkLabel` — How to add badges
- `RevenueDashboard` — How to display metrics

---

## Success Metrics

**When this is complete & integrated:**

- ✅ Every affiliate click is recorded with revenue
- ✅ Admin can see revenue by network
- ✅ Every offer clearly marked as affiliate
- ✅ Users understand how we make money
- ✅ Trust maintained (UX not harmed by monetization)
- ✅ Compliance with FTC/EFTA/MKN rules
- ✅ Data-driven sponsorship decisions possible

---

**Ready to integrate? Start with Phase 2: Click/Impression Tracking!**
