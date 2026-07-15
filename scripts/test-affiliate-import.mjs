import assert from "node:assert/strict";
import test from "node:test";

const PERCENTAGE_PATTERNS = [
  /(\d+(?:[.,]\d+)?)\s*%\s*(?:rabatt|off|extra)?/i,
  /(?:rabatt|spara|save)\s*(?:på\s*)?(\d+(?:[.,]\d+)?)\s*%/i,
  /(\d+(?:[.,]\d+)?)\s*procent/i,
];

const FIXED_PATTERNS = [
  /(\d+(?:[.,]\d+)?)\s*(?:kr|sek|:-)/i,
  /(?:spara|rabatt)\s*(\d+(?:[.,]\d+)?)\s*(?:kr|sek|:-)/i,
];

function parseNumber(value) {
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDiscountFromText(...sources) {
  const text = sources.filter(Boolean).join(" ");

  for (const pattern of PERCENTAGE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = parseNumber(match[1]);
      if (value && value > 0 && value <= 100) {
        return { discountType: "percentage", discountValue: value };
      }
    }
  }

  for (const pattern of FIXED_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = parseNumber(match[1]);
      if (value && value > 0) {
        return { discountType: "fixed_amount", discountValue: Math.round(value) };
      }
    }
  }

  return { discountType: "percentage", discountValue: 5 };
}

function ensureDescription(text, fallback) {
  const normalized = text.trim() || fallback.trim();
  if (normalized.length >= 10) {
    return normalized;
  }

  return `${normalized}. Erbjudandet gäller enligt butikens villkor.`.slice(0, 500);
}

function ensureTitle(text, fallback) {
  const normalized = text.trim() || fallback.trim();
  return normalized.length >= 3 ? normalized : fallback.slice(0, 120);
}

test("parseDiscountFromText detects percentage", () => {
  assert.deepEqual(parseDiscountFromText("20% rabatt på allt"), {
    discountType: "percentage",
    discountValue: 20,
  });
});

test("parseDiscountFromText detects fixed amount", () => {
  assert.deepEqual(parseDiscountFromText("Spara 150 kr på din order"), {
    discountType: "fixed_amount",
    discountValue: 150,
  });
});

test("parseDiscountFromText prefers percentage over fixed", () => {
  assert.deepEqual(parseDiscountFromText("15% rabatt eller 100 kr"), {
    discountType: "percentage",
    discountValue: 15,
  });
});

test("parseDiscountFromText falls back to 5%", () => {
  assert.deepEqual(parseDiscountFromText("Gratis frakt"), {
    discountType: "percentage",
    discountValue: 5,
  });
});

test("ensureDescription pads short copy", () => {
  const result = ensureDescription("Kort", "Fallback title");
  assert.ok(result.length >= 10);
});

test("ensureTitle uses fallback when too short", () => {
  assert.equal(ensureTitle("AB", "Partykungen erbjudande"), "Partykungen erbjudande");
});
