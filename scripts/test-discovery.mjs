// These tests import the real implementation. Node strips the TypeScript
// types at runtime, so the modules under test must stay free of path aliases
// and of TypeScript features that need a full compiler.
import assert from "node:assert/strict";
import test from "node:test";

import { calculateDealScore } from "../src/features/deal-score/score.ts";
import {
  MIN_COUPON_FEEDBACK_VOTES,
  calculateCouponSuccess,
} from "../src/features/coupon-feedback/success.ts";
import { isOfferActive, isOfferExpired } from "../src/features/offers/expiry.ts";
import { resolveOfferPricing } from "../src/features/offers/format.ts";
import { isRecentlyVerified } from "../src/features/offers/verification.ts";
import { resolveOfferCommercialLabel } from "../src/features/offers/commercial-labels.ts";
import { createPublicPath, rankRelatedItems } from "../src/features/related/related.ts";
import { hasIndexableContent } from "../src/shared/lib/indexing.ts";
import { parseInterestIds } from "../src/features/subscribers/interests.ts";

const now = new Date("2026-08-20T12:00:00.000Z");

test("deal score rewards a fresh high-percentage discount", () => {
  const result = calculateDealScore({
    discountType: "percentage",
    discountValue: 40,
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-08-20T08:00:00.000Z",
    lastVerifiedAt: "2026-08-20T10:00:00.000Z",
    endsAt: "2026-08-21T12:00:00.000Z",
    isFeatured: true,
    now,
  });

  assert.equal(result.score >= 60, true);
  assert.equal(result.breakdown.exclusivity, 5);
});

test("deal score stays within 0-100", () => {
  const max = calculateDealScore({
    discountType: "percentage",
    discountValue: 100,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastVerifiedAt: now.toISOString(),
    endsAt: "2026-08-20T20:00:00.000Z",
    isFeatured: true,
    clickCount: 100_000,
    feedbackPositive: 40,
    feedbackTotal: 40,
    now,
  });
  const min = calculateDealScore({
    discountType: "fixed_amount",
    discountValue: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    endsAt: "2026-08-19T00:00:00.000Z",
    now,
  });

  assert.equal(max.score <= 100, true);
  assert.equal(min.score >= 0, true);
  assert.equal(max.score > min.score, true);
});

test("sponsored flag does not increase deal score", () => {
  const base = {
    discountType: "percentage",
    discountValue: 20,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    now,
  };

  assert.equal(
    calculateDealScore(base).score,
    calculateDealScore({ ...base, isSponsored: true }).score,
  );
});

test("expired and unstarted offers are not active", () => {
  assert.equal(
    isOfferActive(
      { status: "published", startsAt: "2026-08-01T00:00:00.000Z", endsAt: "2026-08-19T00:00:00.000Z" },
      now,
    ),
    false,
  );
  assert.equal(
    isOfferActive({ status: "published", startsAt: "2026-09-01T00:00:00.000Z" }, now),
    false,
  );
  assert.equal(isOfferActive({ status: "draft" }, now), false);
  assert.equal(isOfferActive({ status: "published" }, now), true);
  assert.equal(isOfferExpired("2026-08-19T00:00:00.000Z", now), true);
  assert.equal(isOfferExpired(null, now), false);
});

test("pricing never invents a discount", () => {
  assert.equal(resolveOfferPricing({ original_price: 500, current_price: null }), null);

  assert.deepEqual(resolveOfferPricing({ original_price: null, current_price: 299 }), {
    current: 299,
    original: null,
    savings: null,
  });

  // A "before" price that is not higher would be a misleading claim.
  assert.deepEqual(resolveOfferPricing({ original_price: 299, current_price: 299 }), {
    current: 299,
    original: null,
    savings: null,
  });

  assert.deepEqual(resolveOfferPricing({ original_price: 499, current_price: 299 }), {
    current: 299,
    original: 499,
    savings: 200,
  });
});

test("coupon success stays hidden until enough votes", () => {
  const belowThreshold = calculateCouponSuccess({
    positive: MIN_COUPON_FEEDBACK_VOTES - 2,
    total: MIN_COUPON_FEEDBACK_VOTES - 1,
  });

  assert.equal(belowThreshold.hasEnoughData, false);
  assert.equal(belowThreshold.label, null);
  assert.equal(belowThreshold.rate, null);

  assert.deepEqual(calculateCouponSuccess({ positive: 4, total: 5 }), {
    rate: 80,
    label: "80 % säger att koden fungerar",
    hasEnoughData: true,
  });
});

test("verification badge ignores missing and future timestamps", () => {
  assert.equal(isRecentlyVerified(null, now), false);
  assert.equal(isRecentlyVerified("2026-08-19T12:00:00.000Z", now), true);
  assert.equal(isRecentlyVerified("2026-07-01T12:00:00.000Z", now), false);
  assert.equal(isRecentlyVerified("2026-09-01T12:00:00.000Z", now), false);
});

test("commercial labels never brand an editorial pick as paid", () => {
  assert.equal(resolveOfferCommercialLabel({ is_featured: true }), null);
  assert.equal(resolveOfferCommercialLabel({ is_sponsored: true }), "sponsored");
  assert.equal(resolveOfferCommercialLabel({ is_exclusive: true }), "exclusive");
  assert.equal(
    resolveOfferCommercialLabel({ is_sponsored: true, is_exclusive: true }),
    "sponsored",
  );
  assert.equal(resolveOfferCommercialLabel({}), null);
});

test("related content prefers shared category over store", () => {
  const ranked = rankRelatedItems({
    currentId: "a",
    categoryId: "mode",
    storeId: "zalando",
    items: [
      { id: "b", slug: "b", name: "B", categoryId: "mode", storeId: "other" },
      { id: "c", slug: "c", name: "C", categoryId: "other", storeId: "zalando" },
      { id: "d", slug: "d", name: "D", categoryId: "other", storeId: "other" },
    ],
  });

  assert.deepEqual(
    ranked.map((item) => item.id),
    ["b", "c"],
  );
});

test("SEO public paths stay Swedish", () => {
  assert.equal(createPublicPath("best_in_test", "robotdammsugare"), "/bast-i-test/robotdammsugare");
  assert.equal(createPublicPath("review", "airfryer"), "/recensioner/airfryer");
  assert.equal(createPublicPath("store", "elgiganten"), "/butiker/elgiganten");
  assert.equal(createPublicPath("guide", "black-friday"), "/guider/black-friday");
});

test("thin landing pages are kept out of the index", () => {
  assert.equal(hasIndexableContent({ offerCount: 1 }), true);
  assert.equal(hasIndexableContent({ offerCount: 0, articleCount: 2 }), true);
  assert.equal(hasIndexableContent({ offerCount: 0, description: "Kort text." }), false);
  assert.equal(hasIndexableContent({ offerCount: 0, intro: "A".repeat(120) }), true);
  assert.equal(hasIndexableContent({ offerCount: 0 }), false);
});

test("newsletter interests reject unknown values", () => {
  assert.deepEqual(parseInterestIds(["teknik", "hacking", "mode"]), ["teknik", "mode"]);
  assert.deepEqual(parseInterestIds([]), []);
});
