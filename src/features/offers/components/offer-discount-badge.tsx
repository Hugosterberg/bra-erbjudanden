import { TicketPercent } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatDealHeadline } from "../format";
import type { Offer } from "../types";

type OfferDiscountBadgeProps = {
  offer: Pick<Offer, "discount_type" | "discount_value" | "is_up_to" | "deal_label">;
  className?: string;
};

// Prominent, consistent deal indicator shown next to the coupon code and CTA so
// the saving is always immediately clear. Never shows a figure the offer lacks.
export function OfferDiscountBadge({ offer, className }: OfferDiscountBadgeProps) {
  return (
    <span
      className={cn(
        "deal-save-badge inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15",
        className,
      )}
    >
      <span aria-hidden className="deal-save-shine" />
      <TicketPercent className="relative size-4 shrink-0" />
      <span data-numeric className="relative">
        {formatDealHeadline(offer)}
      </span>
    </span>
  );
}
