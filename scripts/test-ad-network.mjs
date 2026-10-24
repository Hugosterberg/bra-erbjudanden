import assert from "node:assert/strict";
import test from "node:test";

import { assessClickFraud, isInvalidReferrer } from "../src/features/ad-network/fraud-signals.ts";
import {
  createWebhookSignature,
  verifyWebhookSignature,
} from "../src/features/ad-network/webhook-signature.ts";

const cleanClick = {
  recentClicksFromIp: 1,
  userAgent: "Mozilla/5.0 (compatible; ExampleBrowser/1.0)",
  ipHash: "abc123",
  referrer: "https://www.google.com/",
  unusualPattern: false,
  recentClicksInSession: 1,
  now: new Date("2026-08-20T12:00:00.000Z"),
};

test("a normal click is not marked fraudulent", () => {
  const result = assessClickFraud(cleanClick);

  assert.equal(result.isFraudulent, false);
  assert.deepEqual(result.flags, []);
  assert.equal(result.riskScore, 0);
});

test("bot traffic and rapid clicks cross the fraud threshold", () => {
  const result = assessClickFraud({
    ...cleanClick,
    recentClicksFromIp: 6,
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  });

  assert.equal(result.flags.includes("rapid_clicks_same_ip"), true);
  assert.equal(result.flags.includes("bot_user_agent"), true);
  assert.equal(result.isFraudulent, true);
  assert.equal(result.riskScore >= 5, true);
});

test("localhost and malformed referrers are invalid", () => {
  assert.equal(isInvalidReferrer("http://localhost/kampanj"), true);
  assert.equal(isInvalidReferrer("not a url"), true);
  assert.equal(isInvalidReferrer("https://example.com/erbjudande"), false);
});

test("webhook signatures match the payload and secret", () => {
  const payload = JSON.stringify({ event: "click", timestamp: "2026-08-20T12:00:00.000Z" });
  const secret = "signing-secret";
  const signature = createWebhookSignature(payload, secret);

  assert.equal(verifyWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyWebhookSignature(payload, signature, "other-secret"), false);
  assert.equal(verifyWebhookSignature(payload, "short", secret), false);
  assert.equal(verifyWebhookSignature(`${payload} `, signature, secret), false);
});
