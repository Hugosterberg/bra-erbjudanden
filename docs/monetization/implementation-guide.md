# Monetization Implementation Guide

## Overview

The monetization system is built on three pillars:

1. **Revenue Tracking** — Record impressions, clicks, and conversions
2. **Sponsorships** — Premium placement for offers
3. **Disclosure** — Transparent communication about affiliate relationships

---

## Phase 1: Revenue Event Recording

### Click Events (Already Implemented)

The `/go/[offerId]` route already records clicks via `recordAffiliateClick()`. This:

```typescript
// src/app/go/[offerId]/route.ts
await recordAffiliateClick(offer);
redirect(offer.affiliate_url);
```

Now we need to:

1. **Integrate with `affiliate_revenue_events`** in `recordAffiliateClick()`
2. **Determine revenue amount** from affiliate network APIs
3. **Aggregate daily metrics** via scheduled task

### Implementation Steps

#### Step 1: Enhance Click Recording

Update `recordAffiliateClick()` in `src/features/tracking/record-click.ts` to also call:

```typescript
await recordRevenueEvent({
  offerId: offer.id,
  affiliateNetwork: offer.affiliate_network,
  eventType: 'click',
  revenueUsd: 0, // To be determined from network
  userAgent: request.headers.get('user-agent') || undefined,
  referrer: request.referrer || undefined,
  ipHash: hashUserIp(request.ip),
});
```

#### Step 2: Impression Tracking

Add impression events when offers are displayed. In `src/features/offers/components/offer-card.tsx`:

```typescript
'use client';

useEffect(() => {
  // Record impression on first render
  recordRevenueEvent({
    offerId,
    affiliateNetwork,
    eventType: 'impression',
    revenueUsd: 0,
  });
}, [offerId, affiliateNetwork]);
```

**Note**: This requires client-side tracking. Consider rate-limiting impressions (max once per session per offer).

#### Step 3: Daily Aggregation

Create a Vercel Cron job at `src/app/api/cron/aggregate-revenue/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Group revenue_events by network and insert into affiliate_revenue_daily
  const { error } = await adminClient.from('affiliate_revenue_daily').upsert(
    networkMetrics.map(metric => ({
      date: dateStr,
      affiliate_network: metric.network,
      impressions: metric.impressions,
      clicks: metric.clicks,
      conversions: metric.conversions,
      revenue_usd: metric.revenue,
      average_cpc: metric.revenue / metric.clicks,
      average_cpm: (metric.revenue / metric.impressions) * 1000,
    })),
    { onConflict: 'date,affiliate_network' }
  );
}
```

Schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate-revenue",
      "schedule": "0 1 * * *"
    }
  ]
}
```

---

## Phase 2: Revenue Determination

### Affiliate Network Revenue APIs

Each network returns commission data differently:

**Awin**: Returns `commissionAmount` in click tracking pixels
**Adtraction**: Returns `commission_sek` in API responses
**Tradedoubler**: Revenue embedded in redirect parameters

Implement network-specific handlers:

```typescript
// src/features/monetization/revenue-mappers/index.ts

export async function getRevenueFromAwin(transactionId: string): Promise<number> {
  const response = await fetch(`https://api.awin.com/transaction/${transactionId}`, {
    headers: { Authorization: `Bearer ${process.env.AWIN_ACCESS_TOKEN}` },
  });
  const data = await response.json();
  return data.commissionAmount || 0;
}

// Similar for other networks...
```

### Conversion Tracking

Implement pixel-based conversion tracking for networks that support it:

1. **Pixel Route**: `src/app/api/pixels/[network]/route.ts`
2. **Parse conversion** from query parameters
3. **Record as conversion event** with `eventType: 'conversion'`

---

## Phase 3: Sponsorship Integration

### Ranking with Sponsorships

Update `src/features/offers/queries.ts` `findPublicOffers()`:

```typescript
export async function findPublicOffers(...) {
  const sponsorships = await findActiveSponsorships();
  const sponsorshipMap = new Map(
    sponsorships.map(s => [s.offer_id, s.reserved_position])
  );

  // Offers are sorted:
  // 1. Featured (is_featured = true)
  // 2. Sponsored (reserved_position 1-20)
  // 3. Manual (rank_position 1-20)
  // 4. Imported (rank_position 21+)
  // 5. Updated date (newest first)
}
```

### Recording Sponsorship Events

When displaying sponsored offer:

```typescript
if (sponsorship) {
  await recordSponsorshipEvent(sponsorship.id, 'impression');
}

// On click:
if (sponsorship) {
  await recordSponsorshipEvent(sponsorship.id, 'click');
}
```

---

## Phase 4: Disclosure on Offers

### Adding Badges to Offer Cards

In `src/features/offers/components/offer-card.tsx`:

```typescript
import { AffiliateLinkLabel } from '@/features/monetization';

export function OfferCard({ offer, sponsorship }: Props) {
  return (
    <div>
      {sponsorship && (
        <Badge variant="gold">Sponsrad</Badge>
      )}
      <AffiliateLinkLabel network={offer.affiliate_network} />
      {/* rest of card */}
    </div>
  );
}
```

### Homepage Disclosure

Add `AffiliateDisclosureBadge` to homepage hero or footer:

```typescript
import { AffiliateDisclosureBadge } from '@/features/monetization';

export function Homepage() {
  return (
    <>
      {/* hero section */}
      <AffiliateDisclosureBadge />
    </>
  );
}
```

---

## Phase 5: Admin Analytics

### Revenue Dashboard Features

The `/admin/intakter` page provides:

- **30-day rolling metrics** (configurable)
- **Per-network breakdown** with trends
- **Top performing offers** by revenue
- **Export to CSV** for accounting

### Creating Reports

```typescript
export async function generateRevenueReport(
  startDate: string,
  endDate: string
): Promise<RevenueReport> {
  const metrics = await calculateRevenueMetrics(startDate, endDate);
  const networkMetrics = await Promise.all(
    AFFILIATE_NETWORKS.map(n => calculateNetworkRevenueMetrics(n, startDate, endDate))
  );

  return {
    period: { startDate, endDate },
    totalRevenue: metrics.totalRevenue,
    breakdown: networkMetrics,
    // ... more fields
  };
}
```

---

## Monitoring & Alerts

### Key Metrics to Watch

1. **Revenue per network** — Is one network underperforming?
2. **Click-through rate** — Are users engaging?
3. **Conversion rate** — How many clicks lead to conversions?
4. **Sponsorship ROI** — Is sponsored placement worth the cost?

### Alerts (Future)

Set up Vercel alerts if:

- Daily revenue drops >20% unexpectedly
- Click volume unusually low
- Sponsored offer has 0 events for 24h

---

## Testing Checklist

- [ ] Click events recorded in `affiliate_revenue_events`
- [ ] Impression events recorded for displayed offers
- [ ] Daily aggregation creates rows in `affiliate_revenue_daily`
- [ ] Revenue amounts are non-zero (from network APIs)
- [ ] Admin dashboard displays accurate totals
- [ ] Affiliate badges appear on all offers
- [ ] Sponsored offers appear in correct ranking position
- [ ] Sponsorship events logged on display and click
- [ ] `/affiliatedisclosure` page is live and discoverable

---

## Security Considerations

### Data Privacy

- Never expose user email/IP in revenue logs
- Use IP hash (SHA256) not raw IP
- Sanitize user_agent to remove unique identifiers

### Revenue Integrity

- Verify clicks against click_events table
- Use Supabase service role for all revenue writes
- Log all revenue modifications in audit trail

### Rate Limiting

- Cap impressions per session per offer (prevent inflation)
- Validate affiliate network webhook signatures
- Implement CSRF tokens for sponsorship creation

---

## Future Enhancements

1. **Real-time Dashboard** — WebSocket updates for live metrics
2. **Machine Learning** — Predict high-performing offers
3. **Affiliate Marketplace** — Automated sponsorship bidding
4. **Performance Benchmarking** — Compare networks to industry standards
5. **Payout Automation** — Direct bank transfer from Supabase to connected accounts
