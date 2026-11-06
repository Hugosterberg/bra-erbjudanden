/**
 * Reads a discount out of free-form campaign text. A number is only reported
 * when the text actually presents it as a saving: "Fri frakt över 499 kr" and
 * "100 % nöjd kund" are not discounts, and showing them as such would be a
 * misleading claim. Offers without a real figure get a descriptive label.
 */
export type ParsedDiscount = {
  discountType: "percentage" | "fixed_amount" | null;
  discountValue: number | null;
  isUpTo: boolean;
  dealLabel: string | null;
};

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;

const PERCENTAGE_PATTERNS = [
  new RegExp(String.raw`${NUMBER}\s*(?:%|procent)\s*(?:rabatt|off|extra|på\b|avdrag)`, "i"),
  new RegExp(String.raw`(?:rabatt|spara|save|sänkt|minus|upp till|hela)\s*(?:på\s*|med\s*)?${NUMBER}\s*(?:%|procent)`, "i"),
  new RegExp(String.raw`(?:^|[\s(])[-−–]\s?${NUMBER}\s*%`, "i"),
];

const FIXED_PATTERNS = [
  new RegExp(String.raw`(?:spara|rabatt|sänkt|minus)\s*(?:på\s*|med\s*)?${NUMBER}\s*(?:kr\b|kronor|sek\b|:-)`, "i"),
  new RegExp(String.raw`${NUMBER}\s*(?:kr|kronor|sek|:-)\s*(?:rabatt|off|avdrag)`, "i"),
  new RegExp(String.raw`(?:^|[\s(])[-−–]\s?${NUMBER}\s*(?:kr\b|sek\b|:-)`, "i"),
];

const UP_TO_PATTERN = /upp till|up to/i;
const FREE_SHIPPING_PATTERN = /(?:fri|gratis)\s+frakt|frakt(?:fritt|\s+0\s*kr)|free shipping/i;
const BUY_X_PAY_Y_PATTERN = /k[öo]p\s+(\d+)\s*,?\s*(?:och\s+)?betala\s+(?:f[öo]r\s+)?(\d+)|\b(\d+)\s*f[öo]r\s*(\d+)\b/i;
const GIFT_PATTERN = /(?:gratis|p[åa] k[öo]pet)\s+(?:present|g[åa]va)|present\s+p[åa] k[öo]pet|gratis g[åa]va/i;

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function findValue(text: string, patterns: RegExp[], max: number) {
  for (const pattern of patterns) {
    const value = parseNumber(text.match(pattern)?.[1] ?? "");
    if (value !== null && value > 0 && value <= max) {
      return value;
    }
  }

  return null;
}

function findDealLabel(text: string) {
  if (FREE_SHIPPING_PATTERN.test(text)) {
    return "Fri frakt";
  }

  const buyXPayY = text.match(BUY_X_PAY_Y_PATTERN);
  if (buyXPayY) {
    const [buy, pay] = [buyXPayY[1] ?? buyXPayY[3], buyXPayY[2] ?? buyXPayY[4]].map(Number);
    if (buy > pay && pay > 0) {
      return `${buy} för ${pay}`;
    }
  }

  return GIFT_PATTERN.test(text) ? "Present på köpet" : null;
}

export function parseDiscountFromText(...sources: Array<string | null | undefined>): ParsedDiscount {
  const text = sources.filter(Boolean).join(" ");
  const isUpTo = UP_TO_PATTERN.test(text);

  // A discount above 90 % is far more often a claim like "100 % bomull".
  const percentage = findValue(text, PERCENTAGE_PATTERNS, 90);
  if (percentage !== null) {
    return { discountType: "percentage", discountValue: percentage, isUpTo, dealLabel: null };
  }

  const fixed = findValue(text, FIXED_PATTERNS, 100_000);
  if (fixed !== null) {
    return {
      discountType: "fixed_amount",
      discountValue: Math.round(fixed),
      isUpTo,
      dealLabel: null,
    };
  }

  return {
    discountType: null,
    discountValue: null,
    isUpTo: false,
    dealLabel: findDealLabel(text),
  };
}

export function ensureDescription(text: string, fallback: string) {
  const normalized = text.trim() || fallback.trim();
  if (normalized.length >= 10) {
    return normalized;
  }

  return `${normalized}. Erbjudandet gäller enligt butikens villkor.`.slice(0, 500);
}

export function ensureTitle(text: string, fallback: string) {
  const normalized = text.trim() || fallback.trim();
  return normalized.length >= 3 ? normalized : fallback.slice(0, 120);
}

/** Feeds without a title field get one from the first sentence of their text. */
export function titleFromText(text: string, fallback: string, maxLength = 90) {
  const firstSentence = text.trim().split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  const source = firstSentence.length >= 3 ? firstSentence : fallback;

  if (source.length <= maxLength) {
    return source;
  }

  const cut = source.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : maxLength).trim()}…`;
}
