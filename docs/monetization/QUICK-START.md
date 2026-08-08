# Monetization Quick Start

**Copy-paste snippets for common tasks.**

---

## 1. Record a Click Event

```typescript
// In src/features/tracking/record-click.ts or similar
import { recordRevenueEvent } from '@/features/monetization';

export async function recordAffiliateClick(offer: Offer) {
  // ... existing code ...
  
  // Add revenue tracking
  await recordRevenueEvent({
    offerId: offer.id,
    affiliateNetwork: offer.affiliate_network,
    eventType: 'click',
    revenueUsd: 0, // Will be updated when network APIs ready
    userAgent: request.headers.get('user-agent') || undefined,
    referrer: request.referrer || undefined,
  });
  
  redirect(offer.affiliate_url);
}
```

---

## 2. Add Affiliate Badge to Offer Card

```typescript
// In src/features/offers/components/offer-card.tsx
import { AffiliateLinkLabel } from '@/features/monetization';

export function OfferCard({ offer }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <AffiliateLinkLabel network={offer.affiliate_network} />
      <h3>{offer.title}</h3>
      {/* rest of card */}
    </div>
  );
}
```

---

## 3. Show Disclosure Banner

```typescript
// On any page
import { AffiliateDisclosureBadge } from '@/features/monetization';

export function MyPage() {
  return (
    <>
      <main>{/* page content */}</main>
      <AffiliateDisclosureBadge />
    </>
  );
}

// Or compact version:
<AffiliateDisclosureBadge compact className="text-xs" />
```

---

## 4. Get Revenue Metrics

```typescript
// In an async Server Component or Action
import { calculateRevenueMetrics } from '@/features/monetization';

const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

const metrics = await calculateRevenueMetrics(
  thirtyDaysAgo.toISOString(),
  today.toISOString()
);

console.log(`Revenue: $${metrics.totalRevenue}`);
console.log(`Clicks: ${metrics.totalClicks}`);
console.log(`Average CPC: $${metrics.averageCpc?.toFixed(2)}`);
```

---

## 5. Get Network-Specific Metrics

```typescript
import { calculateNetworkRevenueMetrics } from '@/features/monetization';

const awinMetrics = await calculateNetworkRevenueMetrics(
  'awin',
  startDate,
  endDate
);

console.log(awinMetrics.totalRevenue);  // USD
console.log(awinMetrics.trend);         // 'up' | 'down' | 'flat'
```

---

## 6. Create a Sponsorship

```typescript
// In admin action or form handler
import { createSponsorship } from '@/features/monetization';

const result = await createSponsorship({
  offerId: '123',
  sponsorName: 'Nike Sweden',
  sponsorWebsiteUrl: 'https://nike.se',
  pricingModel: 'cpc',
  amount: 2.50,
  currency: 'SEK',
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  reservedPosition: 3,
});

if (result.success) {
  console.log(`Sponsorship created: ${result.id}`);
}
```

---

## 7. Pause/Resume Sponsorship

```typescript
import { pauseSponsorship, resumeSponsorship } from '@/features/monetization';

// Pause
await pauseSponsorship(sponsorshipId);

// Resume
await resumeSponsorship(sponsorshipId);
```

---

## 8. Record Sponsorship Event

```typescript
import { recordSponsorshipEvent } from '@/features/monetization';

// When sponsorship is shown
await recordSponsorshipEvent(sponsorshipId, 'impression');

// When user clicks
await recordSponsorshipEvent(sponsorshipId, 'click');
```

---

## 9. Display Revenue Dashboard

```typescript
// In /admin/intakter page
import { RevenueDashboard } from '@/features/monetization';
import { 
  calculateRevenueMetrics, 
  calculateNetworkRevenueMetrics 
} from '@/features/monetization';

const metrics = await calculateRevenueMetrics(start, end);
const networkMetrics = await Promise.all(
  AFFILIATE_NETWORKS.map(n => calculateNetworkRevenueMetrics(n, start, end))
);

export default async function AdminRevenueePage() {
  return (
    <RevenueDashboard 
      metrics={metrics} 
      networkMetrics={networkMetrics} 
    />
  );
}
```

---

## 10. Load Affiliate Disclosure Settings

```typescript
import { findAffiliateDisclosureSettings } from '@/features/monetization';

const settings = await findAffiliateDisclosureSettings();

if (settings?.show_disclosure_badge) {
  return <AffiliateDisclosureBadge />;
}
```

---

## Common Patterns

### Pattern: Track impression on render

```typescript
'use client';

import { useEffect } from 'react';
import { recordRevenueEvent } from '@/features/monetization';

export function OfferCard({ offerId, network }: Props) {
  useEffect(() => {
    // Record impression once per component mount
    recordRevenueEvent({
      offerId,
      affiliateNetwork: network,
      eventType: 'impression',
      revenueUsd: 0,
    });
  }, [offerId, network]);

  return <div>{/* card content */}</div>;
}
```

### Pattern: Format revenue display

```typescript
function formatCurrency(value: number | null) {
  if (!value) return '-';
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// Usage:
<p>{formatCurrency(metrics.totalRevenue)}</p>
<p>{formatCurrency(metrics.averageCpc)}</p>
```

### Pattern: Filter active sponsorships

```typescript
import { findActiveSponsorships } from '@/features/monetization';

const active = await findActiveSponsorships();
const bySponsor = new Map(
  active.map(s => [s.offer_id, s])
);

// Check if offer is sponsored
if (bySponsor.has(offerId)) {
  return <SponsoredBadge />;
}
```

---

## Validation

Use Zod schemas for form validation:

```typescript
import { createSponsorshipSchema } from '@/features/monetization';

const formData = {
  offerId: '123',
  sponsorName: 'Nike',
  pricingModel: 'cpc',
  amount: 2.50,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 86400000).toISOString(),
};

try {
  const validated = createSponsorshipSchema.parse(formData);
  await createSponsorship(validated);
} catch (error) {
  console.error('Validation failed:', error.issues);
}
```

---

## Database Queries (Direct SQL)

### Get revenue by date

```sql
SELECT 
  date, 
  affiliate_network, 
  revenue_usd, 
  clicks, 
  impressions
FROM affiliate_revenue_daily
WHERE date >= now()::date - interval '30 days'
ORDER BY date DESC, revenue_usd DESC;
```

### Get top offers by revenue

```sql
SELECT 
  offer_id, 
  SUM(revenue_usd) as total_revenue,
  COUNT(*) as clicks
FROM affiliate_revenue_events
WHERE event_type = 'click' 
  AND recorded_at >= now() - interval '30 days'
GROUP BY offer_id
ORDER BY total_revenue DESC
LIMIT 10;
```

### Check sponsored offers

```sql
SELECT 
  s.id,
  s.offer_id,
  s.sponsor_name,
  s.reserved_position,
  s.starts_at,
  s.ends_at,
  COUNT(se.id) as events
FROM sponsorships s
LEFT JOIN sponsorship_events se ON s.id = se.sponsorship_id
WHERE s.status = 'active' 
  AND s.ends_at > now()
GROUP BY s.id
ORDER BY s.reserved_position ASC;
```

---

## Tips

- 🔒 Always use server-side queries for sensitive data
- 📊 Cache revenue metrics for 1 hour to avoid DB spam
- 🎯 Record events with full context (user_agent, referrer, ip_hash)
- 💡 Test revenue tracking before going live
- 📱 Keep affiliate badges small on mobile
- 🇸🇪 Use Swedish strings in UI, English in code

---

## Debugging

### Check if events are recorded

```sql
SELECT COUNT(*) FROM affiliate_revenue_events 
WHERE recorded_at > now() - interval '1 hour';
```

### Check daily aggregation

```sql
SELECT * FROM affiliate_revenue_daily 
WHERE date = CURRENT_DATE 
ORDER BY revenue_usd DESC;
```

### Verify sponsorship is active

```sql
SELECT * FROM sponsorships 
WHERE offer_id = 'your-offer-id' 
  AND status = 'active'
  AND ends_at > now();
```

---

**For full details, see:**
- Implementation Guide: `docs/monetization/implementation-guide.md`
- Complete Setup: `docs/monetization/SETUP.md`
- Strategy: `docs/monetization/strategy.md`
