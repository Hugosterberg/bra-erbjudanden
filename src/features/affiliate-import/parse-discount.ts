export type ParsedDiscount = {
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
};

const PERCENTAGE_PATTERNS = [
  /(\d+(?:[.,]\d+)?)\s*%\s*(?:rabatt|off|extra)?/i,
  /(?:rabatt|spara|save)\s*(?:på\s*)?(\d+(?:[.,]\d+)?)\s*%/i,
  /(\d+(?:[.,]\d+)?)\s*procent/i,
];

const FIXED_PATTERNS = [
  /(\d+(?:[.,]\d+)?)\s*(?:kr|sek|:-)/i,
  /(?:spara|rabatt)\s*(\d+(?:[.,]\d+)?)\s*(?:kr|sek|:-)/i,
];

function parseNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDiscountFromText(...sources: Array<string | null | undefined>): ParsedDiscount {
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

  // Fallback keeps DB constraint satisfied; imported offers still surface by recency.
  return { discountType: "percentage", discountValue: 5 };
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
