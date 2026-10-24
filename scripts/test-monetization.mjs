import assert from "node:assert/strict";
import test from "node:test";

import { meetsFloor } from "../src/features/monetization/bid-floor.ts";
import { revenueTrend, summarizeRevenueEvents } from "../src/features/monetization/revenue-metrics.ts";
import { createSponsorshipSchema } from "../src/features/monetization/schemas.ts";

test("revenue summary counts events and derives cpc, cpm, and conversion rate", () => {
  const summary = summarizeRevenueEvents([
    { event_type: "impression", revenue_usd: 0 },
    { event_type: "impression", revenue_usd: 0 },
    { event_type: "click", revenue_usd: 2 },
    { event_type: "conversion", revenue_usd: 8 },
  ]);

  assert.equal(summary.totalImpressions, 2);
  assert.equal(summary.totalClicks, 1);
  assert.equal(summary.totalConversions, 1);
  assert.equal(summary.totalRevenue, 10);
  assert.equal(summary.averageCpc, 10);
  assert.equal(summary.averageCpm, 5000);
  assert.equal(summary.conversionRate, 100);
});

test("revenue summary stays empty when there are no events", () => {
  const summary = summarizeRevenueEvents([]);

  assert.equal(summary.totalRevenue, 0);
  assert.equal(summary.averageCpc, null);
  assert.equal(summary.averageCpm, null);
  assert.equal(summary.conversionRate, 0);
});

test("revenue trend compares the second half with the first", () => {
  assert.equal(
    revenueTrend([
      { event_type: "click", revenue_usd: 10 },
      { event_type: "click", revenue_usd: 20 },
    ]),
    "up",
  );
  assert.equal(
    revenueTrend([
      { event_type: "click", revenue_usd: 20 },
      { event_type: "click", revenue_usd: 10 },
    ]),
    "down",
  );
  assert.equal(
    revenueTrend([
      { event_type: "click", revenue_usd: 10 },
      { event_type: "click", revenue_usd: 10 },
    ]),
    "flat",
  );
});

test("a missing floor accepts any bid and a set floor is inclusive", () => {
  assert.equal(meetsFloor(0), true);
  assert.equal(meetsFloor(1.5, 2), false);
  assert.equal(meetsFloor(2, 2), true);
});

test("sponsorship schema rejects a non-positive amount", () => {
  const result = createSponsorshipSchema.safeParse({
    offerId: "6f1e7b3a-8c2d-4e5f-9a0b-1c2d3e4f5a6b",
    sponsorName: "Exempel",
    pricingModel: "cpc",
    amount: 0,
    startsAt: "2026-08-20T12:00:00.000Z",
    endsAt: "2026-08-21T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});
