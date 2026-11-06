// Imports the real adapters and parsers. The sample records follow the fields
// in each network's API documentation, including fields that must NOT be used.
import assert from "node:assert/strict";
import test from "node:test";

import { mapAddrevenueCampaign } from "../src/features/affiliate-import/adapters/addrevenue.ts";
import { mapAdtractionOffer } from "../src/features/affiliate-import/adapters/adtraction.ts";
import { mapAwinPromotion } from "../src/features/affiliate-import/adapters/awin.ts";
import { mapTradedoublerVoucher } from "../src/features/affiliate-import/adapters/tradedoubler.ts";
import {
  ensureDescription,
  ensureTitle,
  parseDiscountFromText,
  titleFromText,
} from "../src/features/affiliate-import/parse-discount.ts";
import { suggestCategorySlug } from "../src/features/affiliate-import/suggest-category.ts";
import { isTrackingUrl } from "../src/features/tracking/click-reference.ts";

const none = { discountType: null, discountValue: null, isUpTo: false };

test("real discounts are read from the text", () => {
  assert.deepEqual(parseDiscountFromText("20% rabatt på allt"), {
    discountType: "percentage",
    discountValue: 20,
    isUpTo: false,
    dealLabel: null,
  });
  assert.equal(parseDiscountFromText("Spara 150 kr på din order").discountValue, 150);
  assert.equal(parseDiscountFromText("Spara 150 kr på din order").discountType, "fixed_amount");
  assert.equal(parseDiscountFromText("15% rabatt eller 100 kr").discountType, "percentage");
  assert.equal(parseDiscountFromText("Medlemmar får 15 % rabatt").discountValue, 15);
  assert.equal(parseDiscountFromText("Vinterjackor -30%").discountValue, 30);
});

test("up to is kept so that a maximum is not shown as a flat discount", () => {
  const parsed = parseDiscountFromText("Upp till 70% på rean");
  assert.equal(parsed.discountValue, 70);
  assert.equal(parsed.isUpTo, true);
});

test("numbers that are not discounts never become discounts", () => {
  for (const text of [
    "Fri frakt vid köp över 499 kr",
    "Handla för 800 kr och få en gratis present",
    "Från 99 kr – nya vinterjackor",
    "24 timmars leverans - 100% nöjd kund-garanti",
    "Årets Black Friday 2026",
    "Gratis retur inom 365 dagar",
    "Få nyheter först – anmäl dig till nyhetsbrevet",
  ]) {
    const parsed = parseDiscountFromText(text);
    assert.equal(parsed.discountType, none.discountType, text);
    assert.equal(parsed.discountValue, none.discountValue, text);
  }
});

test("offers without a figure get an honest label", () => {
  assert.equal(parseDiscountFromText("Fri frakt vid köp över 499 kr").dealLabel, "Fri frakt");
  assert.equal(parseDiscountFromText("Köp 3 betala för 2 på t-shirts").dealLabel, "3 för 2");
  assert.equal(parseDiscountFromText("Handla för 800 kr och få en gratis present").dealLabel, "Present på köpet");
  assert.equal(parseDiscountFromText("Årets Black Friday").dealLabel, null);
});

test("short feed text is padded and long text becomes a readable title", () => {
  assert.ok(ensureDescription("Kort", "Fallback title").length >= 10);
  assert.equal(ensureTitle("AB", "Partykungen erbjudande"), "Partykungen erbjudande");
  assert.equal(titleFromText("20% på allt. Gäller t.o.m. söndag.", "x"), "20% på allt.");
  assert.ok(titleFromText("a ".repeat(200), "x").length <= 91);
});

test("awin uses urlTracking and voucher.code, never the merchant url", () => {
  const offer = mapAwinPromotion(
    {
      promotionId: 991,
      title: "20% rabatt på skor",
      description: "Gäller hela sortimentet",
      url: "https://www.butiken.se/kampanj",
      urlTracking: "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=x",
      voucher: { code: "SKOR20", exclusive: false, attributable: true },
      advertiser: { id: 1, name: "Butiken", joined: true },
      endDate: "2099-01-01T00:00:00Z",
    },
    "2",
  );

  assert.equal(offer.affiliateUrl, "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=x");
  assert.equal(offer.discountCode, "SKOR20");
  assert.equal(offer.redemptionType, "discount_code");
  assert.equal(offer.externalId, "991");
  assert.equal(isTrackingUrl("awin", offer.affiliateUrl), true);
  assert.match(offer.store.affiliateUrl, /awinmid=1&awinaffid=2/);
});

test("awin rows with only a merchant url are dropped", () => {
  const offer = mapAwinPromotion(
    { promotionId: 1, title: "Titel", url: "https://www.butiken.se", advertiser: { id: 1, name: "B" } },
    "2",
  );
  assert.equal(offer, null);
});

test("tradedoubler pays through defaultTrackUri and reports its own discount", () => {
  const offer = mapTradedoublerVoucher({
    id: 16043,
    programId: 15603,
    programName: "Butiken",
    code: "XS51F9",
    voucherTypeId: 1,
    title: "Rabatt på allt",
    description: "Beskrivning av erbjudandet",
    defaultTrackUri: "https://clk.tradedoubler.com/click?p=1&a=2&g=3",
    landingUrl: "https://www.butiken.se/rea",
    logoPath: "https://cdn.example.com/logo.png",
    endDate: 4102444800000,
  });
  assert.equal(offer.affiliateUrl, "https://clk.tradedoubler.com/click?p=1&a=2&g=3");
  assert.equal(offer.discountCode, "XS51F9");
  assert.equal(offer.store.websiteUrl, null);
  assert.equal(offer.store.logoUrl, "https://cdn.example.com/logo.png");
  assert.equal(offer.store.affiliateUrl, null);

  const discount = mapTradedoublerVoucher({
    id: 2,
    programId: 3,
    programName: "B",
    voucherTypeId: 2,
    discountAmount: 10,
    isPercentage: true,
    title: "Kampanj",
    defaultTrackUri: "https://clk.tradedoubler.com/click?p=1&a=2&g=3",
  });
  assert.equal(discount.discountType, "percentage");
  assert.equal(discount.discountValue, 10);

  const freeShipping = mapTradedoublerVoucher({
    id: 3,
    programId: 3,
    programName: "B",
    voucherTypeId: 4,
    title: "Leverans hem",
    defaultTrackUri: "https://clk.tradedoubler.com/click?p=1&a=2&g=3",
  });
  assert.equal(freeShipping.dealLabel, "Fri frakt");
});

test("adtraction only imports offers from approved programmes", () => {
  const programs = new Map([
    ["7", { name: "Butiken", websiteUrl: "https://butiken.se", logoUrl: null, trackingUrl: "https://go.adt1.com/t/t?a=1&as=2&t=2&tk=1" }],
  ]);
  const record = {
    offerId: 55,
    programId: 7,
    programName: "Butiken",
    market: "SE",
    offerDescription: "15% rabatt på allt. Gäller hela veckan.",
    offerType: 1,
    offerCoupon: "BUTIK15",
    trackingURL: "https://go.adt1.com/t/t?a=1&as=2&t=1&tk=1",
  };

  const offer = mapAdtractionOffer(record, programs);
  assert.equal(offer.discountCode, "BUTIK15");
  assert.equal(offer.discountValue, 15);
  assert.equal(offer.title, "15% rabatt på allt.");
  assert.equal(isTrackingUrl("adtraction", offer.affiliateUrl), true);

  assert.equal(mapAdtractionOffer({ ...record, programId: 8 }, programs), null);
  assert.equal(mapAdtractionOffer({ ...record, market: "NO" }, programs), null);

  const couponWithoutCode = mapAdtractionOffer({ ...record, offerCoupon: "" }, programs);
  assert.equal(couponWithoutCode.redemptionType, "direct_link");
});

test("addrevenue needs trackingLink and reads the documented date fields", () => {
  const advertisers = new Map([["9", { name: "Butiken", websiteUrl: null, logoUrl: null }]]);
  const record = {
    id: 12,
    advertiserId: 9,
    description: "10% rabatt med koden",
    discountCode: "TIO",
    url: "https://butiken.se",
    trackingLink: "https://addrevenue.io/t?c=1&a=9",
    validFrom: "2026-01-01",
    validTo: "2099-01-01",
    status: "active",
    markets: ["SE"],
  };

  const offer = mapAddrevenueCampaign(record, advertisers);
  assert.equal(offer.externalId, "12");
  assert.equal(offer.affiliateUrl, "https://addrevenue.io/t?c=1&a=9");
  assert.ok(offer.endsAt.startsWith("2099"));

  assert.equal(mapAddrevenueCampaign({ ...record, trackingLink: undefined }, advertisers), null);
  assert.equal(mapAddrevenueCampaign({ ...record, markets: ["NO"] }, advertisers), null);
  assert.equal(mapAddrevenueCampaign({ ...record, validTo: "2020-01-01" }, advertisers), null);
});

test("categories are suggested from whole words only", () => {
  assert.equal(suggestCategorySlug("Rabatt på vinterjackor och skor"), "mode");
  assert.equal(suggestCategorySlug("Billiga hotell i Rom"), "resor");
  assert.equal(suggestCategorySlug("Köp nu"), null);
  // "tv" inside another word must not match.
  assert.equal(suggestCategorySlug("Tvätt och städ"), null);
});
