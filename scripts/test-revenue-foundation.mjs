import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCampaignEmail,
  buildConfirmationEmail,
  escapeHtml,
} from "../src/features/newsletter/templates.ts";
import {
  formatDealHeadline,
  formatDealValue,
  isCommercialLink,
} from "../src/features/offers/format.ts";
import {
  calculateEpc,
  mapAddrevenueTransaction,
  mapAdtractionTransaction,
  mapAwinTransaction,
} from "../src/features/revenue/mappers.ts";
import { matchesSeasonalKeywords } from "../src/features/seasonal/pages.ts";
import {
  appendClickReference,
  detectNetworkFromUrl,
  isTrackingUrl,
  parseClickReference,
  toClickReference,
} from "../src/features/tracking/click-reference.ts";
import { isLikelyBot, isPrefetchRequest } from "../src/features/tracking/request-classification.ts";

const CLICK = "0a1b2c3d4e5f60718293a4b5c6d7e8f9";

test("the click reference goes first so a trailing destination cannot swallow it", () => {
  assert.equal(
    appendClickReference("https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=https%3A%2F%2Fx.se", "awin", CLICK),
    `https://www.awin1.com/cread.php?clickref=${CLICK}&awinmid=1&awinaffid=2&ued=https%3A%2F%2Fx.se`,
  );
  assert.equal(
    appendClickReference("https://clk.tradedoubler.com/click?p=1&a=2&g=3&url=https://x.se", "tradedoubler", CLICK),
    `https://clk.tradedoubler.com/click?epi=${CLICK}&p=1&a=2&g=3&url=https://x.se`,
  );
  assert.equal(
    appendClickReference("https://go.adt1.com/t/t?a=1&as=2", "adtraction", CLICK),
    `https://go.adt1.com/t/t?epi=${CLICK}&a=1&as=2`,
  );
});

test("older tradedoubler links keep their parenthesis format", () => {
  assert.equal(
    appendClickReference("https://clk.tradedoubler.com/click?p(1)a(2)g(3)url(https://x.se)", "tradedoubler", CLICK),
    `https://clk.tradedoubler.com/click?p(1)a(2)g(3)epi(${CLICK})url(https://x.se)`,
  );
});

test("links stay untouched when no reference can be added safely", () => {
  const plain = "https://smilo.se/kampanj?a=1";
  assert.equal(appendClickReference(plain, null, CLICK), plain);
  // Addrevenue documents no parameter, so it is off until a test purchase confirms one.
  const addrevenue = "https://addrevenue.io/t?c=1&a=2";
  assert.equal(appendClickReference(addrevenue, "addrevenue", CLICK), addrevenue);
  assert.equal(
    appendClickReference(addrevenue, "addrevenue", CLICK, { addrevenueParam: "r" }),
    `https://addrevenue.io/t?r=${CLICK}&c=1&a=2`,
  );
  const withEpi = "https://click.adrecord.com/?c=1&p=2&epi=egen";
  assert.equal(appendClickReference(withEpi, "adrecord", CLICK), withEpi);
});

test("network detection recognises tracking links and rejects store links", () => {
  assert.equal(detectNetworkFromUrl("https://www.awin1.com/cread.php?awinmid=1"), "awin");
  assert.equal(detectNetworkFromUrl("https://clk.tradedoubler.com/click?p=1"), "tradedoubler");
  assert.equal(detectNetworkFromUrl("https://click.adrecord.com/?c=1"), "adrecord");
  assert.equal(detectNetworkFromUrl("https://addrevenue.io/t?c=1&a=2"), "addrevenue");
  assert.equal(detectNetworkFromUrl("https://go.adt1.com/t/t?a=1&as=2"), "adtraction");
  assert.equal(detectNetworkFromUrl("https://at.butiken.se/t/t?a=1&as=2"), "adtraction");
  assert.equal(detectNetworkFromUrl("https://smilo.se"), null);
  assert.equal(detectNetworkFromUrl("https://evilawin1.com/x"), null);
  assert.equal(detectNetworkFromUrl("inte en url"), null);
  assert.equal(isTrackingUrl("awin", "https://butiken.se/kampanj"), false);
});

test("click references round trip to the stored uuid", () => {
  const uuid = "0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9";
  assert.equal(toClickReference(uuid), CLICK);
  assert.equal(parseClickReference(CLICK), uuid);
  assert.equal(parseClickReference("egen-kod"), null);
  assert.equal(parseClickReference(null), null);
});

test("prefetches and bots are not counted as clicks", () => {
  const headers = (values) => new Headers(values);
  assert.equal(isPrefetchRequest("GET", headers({ rsc: "1", "next-router-prefetch": "1" })), true);
  assert.equal(isPrefetchRequest("GET", headers({ "sec-purpose": "prefetch" })), true);
  assert.equal(isPrefetchRequest("HEAD", headers({})), true);
  assert.equal(isPrefetchRequest("GET", headers({ accept: "text/html" })), false);

  assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isLikelyBot("curl/8.0"), true);
  assert.equal(isLikelyBot(null), true);
  assert.equal(isLikelyBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1"), false);
});

test("deals never claim a figure the offer lacks", () => {
  const base = { discount_type: null, discount_value: null, is_up_to: false, deal_label: null };
  assert.equal(formatDealValue(base), "Kampanj");
  assert.equal(formatDealHeadline(base), "Aktuell kampanj");
  assert.equal(formatDealHeadline({ ...base, deal_label: "Fri frakt" }), "Fri frakt");
  const percent = { ...base, discount_type: "percentage", discount_value: 20 };
  assert.equal(formatDealHeadline(percent), "Spara 20%");
  assert.equal(formatDealHeadline({ ...percent, is_up_to: true }), "Spara upp till 20%");
  assert.equal(formatDealValue({ ...base, discount_type: "fixed_amount", discount_value: 150 }), "150 kr");
});

test("only links that can earn money are marked as ads", () => {
  const offer = { affiliate_network: null, affiliate_url: "https://smilo.se", is_sponsored: false };
  assert.equal(isCommercialLink(offer), false);
  assert.equal(isCommercialLink({ ...offer, is_sponsored: true }), true);
  assert.equal(isCommercialLink({ ...offer, affiliate_network: "awin" }), true);
  assert.equal(isCommercialLink({ ...offer, affiliate_url: "https://www.awin1.com/cread.php?a=1" }), true);
});

test("awin transactions keep our click reference", () => {
  const item = mapAwinTransaction({
    id: 1234,
    advertiserId: 77,
    commissionStatus: "declined",
    commissionAmount: { amount: 12.5, currency: "SEK" },
    saleAmount: { amount: 250, currency: "SEK" },
    clickRefs: { clickRef: CLICK },
    transactionDate: "2026-11-01T10:00:00",
  });
  assert.equal(item.externalId, "1234");
  assert.equal(item.status, "rejected");
  assert.equal(item.commission, 12.5);
  assert.equal(item.clickId, "0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9");
  assert.equal(item.programExternalId, "77");
  assert.equal(mapAwinTransaction({ commissionStatus: "pending" }), null);
});

test("adtraction statuses map to ours and paid requires approval", () => {
  const base = { uniqueId: "u1", commission: 10, orderValue: 100, currency: "SEK", transactionDate: "2026-11-01", click: { epi: CLICK } };
  assert.equal(mapAdtractionTransaction({ ...base, transactionStatus: 2 }).status, "pending");
  assert.equal(mapAdtractionTransaction({ ...base, transactionStatus: 4 }).status, "pending");
  assert.equal(mapAdtractionTransaction({ ...base, transactionStatus: 5 }).status, "rejected");
  assert.equal(mapAdtractionTransaction({ ...base, transactionStatus: 1 }).status, "approved");
  assert.equal(mapAdtractionTransaction({ ...base, transactionStatus: 1, paymentId: 9 }).status, "paid");
  assert.ok(mapAdtractionTransaction({ ...base, transactionStatus: 1 }).clickId);
});

test("addrevenue finds our reference in clickRef or sub-ids, not their click id", () => {
  const base = { id: 5, advertiserId: 9, status: "paidOut", commission: "7.50", eventValue: 75, currency: "SEK", date: "2026-11-01" };
  assert.equal(mapAddrevenueTransaction(base).status, "paid");
  assert.equal(mapAddrevenueTransaction(base).commission, 7.5);
  assert.equal(mapAddrevenueTransaction({ ...base, clickId: CLICK }).clickId, null);
  assert.ok(mapAddrevenueTransaction({ ...base, clickRef: CLICK }).clickId);
  assert.ok(mapAddrevenueTransaction({ ...base, subids: { r: CLICK } }).clickId);
});

test("earnings per click need clicks to mean anything", () => {
  assert.equal(calculateEpc({ clicks: 0, pendingCommission: 10, approvedCommission: 0 }), null);
  assert.equal(calculateEpc({ clicks: 10, pendingCommission: 5, approvedCommission: 15 }), 2);
});

const sender = {
  siteName: "braerbjudanden.se",
  siteUrl: "https://www.braerbjudanden.se",
  companyName: "Exempel AB",
  address: "Gatan 1, Stockholm",
};

test("marketing mail states the sender, that it is an ad and how to leave", () => {
  const email = buildCampaignEmail({
    subject: "Veckans <bästa>",
    intro: "Hej & välkommen",
    unsubscribeUrl: "https://www.braerbjudanden.se/nyhetsbrev/avregistrera?token=abc",
    sender,
    offers: [{ id: "o1", title: "20% <rea>", deal: "Spara 20%", storeName: "Butik", discountCode: "KOD" }],
  });

  for (const body of [email.html, email.text]) {
    assert.match(body, /Reklam från braerbjudanden\.se/);
    assert.match(body, /annonslänkar/);
    assert.match(body, /Exempel AB/);
    assert.match(body, /avregistrera\?token=abc/);
    assert.match(body, /\/go\/o1/);
  }
  assert.doesNotMatch(email.html, /<rea>/);
  assert.match(email.html, /Hej &amp; välkommen/);
});

test("confirmation mail links to the confirmation page and escapes values", () => {
  const email = buildConfirmationEmail({
    confirmUrl: "https://www.braerbjudanden.se/nyhetsbrev/bekrafta?token=abc",
    sender,
  });
  assert.match(email.html, /bekrafta\?token=abc/);
  assert.match(email.text, /bekrafta\?token=abc/);
  assert.equal(escapeHtml(`<a href="x">'&`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
});

test("seasonal pages only claim offers that mention the campaign", () => {
  assert.equal(matchesSeasonalKeywords({ title: "Black Friday hos Butiken", description: "" }, ["black friday"]), true);
  assert.equal(matchesSeasonalKeywords({ title: "20% rabatt", description: "Hela sortimentet" }, ["black friday"]), false);
});
