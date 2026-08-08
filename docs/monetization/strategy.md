# Monetization Strategy för braerbjudanden.se

## Status heute (2026-08-08)

### ✅ Redan implementerat

**Affiliate-import Infrastructure**
- 5 svenska affiliate-nätverk integrerade (Addrevenue, Adtraction, Adrecord, Awin, Tradedoubler)
- Auto-import via Vercel Cron 2x dagligen
- Separate network logging och status tracking
- Ranking system: manuella offers 1-20, importerade 21+ (sorterade efter rabatt)
- Admin dashboard för manuell körning och konfiguration
- Idempotent upsert (external_id + network) förhindrar dubletter
- Arkivering av utgångna offers

**Click Tracking**
- `/go/[offerId]` redirect med server-side click recording
- Spårning av user_agent, IP hash, referrer
- Persistering i Supabase via service-role för accuracy

**Core Data Model**
- offers (title, description, discount_type, discount_value, affiliate_url, status, ranking)
- stores (name, logo_url, website_url)
- categories (for discovery)
- click_events (timestamp, referrer, user_agent)
- affiliate_import_runs (batch logging)
- affiliate_import_network_runs (per-network status)

### ⚠️ Behöver förbättras / Nya features

**Tier 1 - Kritisk (påverkar intäkter direkt)**
1. **Revenue Analytics Dashboard**
   - Earnings per network per day/week/month
   - CPM (cost per mille) vs CPC (cost per click) revenue
   - Network comparison: ROI, earnings velocity
   - Top performing offers (by clicks, revenue)
   - Historical trend analysis

2. **Sponsorship & Paid Placement**
   - Mark offers as "sponsored" with disclosure badge
   - Reserve top positions (rank 1-10) for premium/sponsored offers
   - Separate pricing models: CPM, CPC, flat fee per day
   - Admin UI for sponsor management

3. **Native Ads / Contextual Ads**
   - Sponsored content cards in offer grid (clearly labeled)
   - Sponsored store spotlights
   - Integration with Swedish ad networks (Google Adsense, Matomo, etc.)

4. **Detailed Affiliate Disclosures**
   - Per-page disclosure (especially landing pages, category pages)
   - Clear "Affiliate Link" badges on every offer card
   - Modal/tooltip explaining how we earn money
   - GDPR-compliant cookie consent for tracking

**Tier 2 - Viktig (förbättrar user experience & trust)**
5. **Store Partnership Program**
   - Direct relationships with stores for exclusive offers
   - Store revenue metrics (how much did THIS store contribute)
   - Performance incentives for high-performing stores

6. **Newsletter Monetization**
   - Sponsored segments in weekly email (clearly disclosed)
   - Premium sponsor placement
   - Newsletter performance tracking (open rates, click-through)

7. **Search Monetization**
   - Sponsored results in site search
   - Promoted categories
   - Featured merchants

8. **User Engagement Tracking**
   - Which categories drive most clicks
   - User journey: discovery → click → external
   - Repeat visitor tracking (anonymous)
   - Engagement metrics for optimization

**Tier 3 - Enhancements (optimization & scale)**
9. **A/B Testing Framework**
   - Test offer card layouts
   - Test ranking algorithms
   - Test sponsored placements
   - Statistical significance testing

10. **Revenue Sharing / Affiliate Program**
    - Allow micro-influencers to promote on braerbjudanden.se
    - Revenue split model
    - Creator dashboard

11. **Mobile Monetization**
    - App install ads
    - Notification campaigns for top offers
    - Push notification monetization

12. **Performance Optimization**
    - Lazy-load ad networks
    - Revenue vs site speed tradeoff
    - Cache strategy for ads

---

## Implementation Priority (This Sprint)

### Week 1: Revenue Foundation
- [ ] Create `monetization` feature with revenue schema
- [ ] Build revenue tracking in affiliate_import process
- [ ] Create basic revenue analytics views
- [ ] Add monetization dashboard to admin

### Week 2: Disclosure & Trust
- [ ] Add "Affiliate Disclosure" policy page (Swedish)
- [ ] Add disclosure badges to all offer cards
- [ ] Create reusable disclosure component
- [ ] Update SEO metadata for transparency

### Week 3: Sponsorship System
- [ ] Create sponsorship data model
- [ ] Build admin UI for sponsor management
- [ ] Implement sponsored offer ranking
- [ ] Add sponsored badge to UI

### Week 4: Analytics & Reporting
- [ ] Create revenue report endpoints
- [ ] Build admin analytics dashboard
- [ ] Network performance comparison
- [ ] Export capabilities (CSV)

---

## Technical Decisions

### Revenue Tracking
- Store revenue data in Supabase (not third-party analytics only)
- Log at: offer impression, click, external conversion (via pixel tracking)
- Keep data fresh but respect privacy (no PII in revenue logs)

### Ad Network Strategy
- Start with affiliate networks (already integrated)
- Add Google Adsense for contextual ads (fallback monetization)
- Consider Adnetsense/Norsk Media partnerships later
- Never sacrifice UX for ads (limit placement, quality control)

### Compliance
- Ensure all affiliate links marked with disclosure
- GDPR consent for analytics tracking
- FTC/EFTA compliance for endorsements
- Swedish consumer protection laws (MKN)

### Performance
- Don't load ad networks until viewport needs them (lazy)
- Cache affiliate data aggressively
- Monitor Core Web Vitals impact
- A/B test revenue features to ensure they don't hurt engagement

---

## Definition of Success

**Month 1:**
- Revenue tracking implemented and accurate
- All offers clearly marked as affiliate links
- Admin can see basic revenue metrics

**Month 3:**
- 50% of premium placements monetized
- Newsletter generating 5-10% of total revenue
- Revenue analytics informing offer ranking

**Month 6:**
- Multi-channel monetization (affiliate + ads + sponsorships)
- Revenue per network optimized
- User trust maintained (low bounce rate from monetization changes)
