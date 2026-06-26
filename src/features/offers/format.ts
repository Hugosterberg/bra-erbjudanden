import type { DiscountType } from "./types";

export function formatDiscount(type: DiscountType, value: number) {
  if (type === "percentage") {
    return `${Math.round(value)}%`;
  }

  return `${Math.round(value)} kr`;
}

export function formatOfferValidity(date: string | null) {
  if (!date) {
    return "Tills vidare";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
