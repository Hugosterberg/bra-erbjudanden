"use client";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordCouponCopyAction } from "@/features/tracking/actions";
import { cn } from "@/lib/utils";

import { copyTextToClipboard } from "../copy-code";
import { formatOfferDestination, isCommercialLink } from "../format";
import type { OfferWithRelations } from "../types";

type OfferCtaProps = {
  offer: OfferWithRelations;
  size?: "default" | "lg";
  className?: string;
};

/**
 * The one way out to a store. It is a plain anchor on purpose: next/link would
 * prefetch the tracking route as soon as the button scrolled into view, and
 * each prefetch would look like a click. Copying the code in the same action
 * means a shopper with a code still passes our tracking link on the way.
 */
export function OfferCta({ offer, size = "default", className }: OfferCtaProps) {
  const destination = formatOfferDestination(offer);
  const code = offer.discount_code;

  function handleClick() {
    if (code) {
      void copyTextToClipboard(code);
      void recordCouponCopyAction(offer.id).catch(() => {});
    }
  }

  return (
    <div className="grid gap-1">
      <Button
        asChild
        size={size}
        className={cn("h-auto w-full whitespace-normal py-2 text-center leading-tight", className)}
      >
        <a
          href={`/go/${offer.id}`}
          target="_blank"
          rel="sponsored nofollow noopener"
          onClick={handleClick}
        >
          {code ? `Kopiera koden och gå till ${destination}` : `Gå till ${destination}`}
          <ArrowUpRight className="size-4 shrink-0" />
          <span className="sr-only">(öppnas i nytt fönster)</span>
        </a>
      </Button>
      {isCommercialLink(offer) ? (
        <p className="text-center text-[11px] leading-4 text-muted-foreground">
          Annonslänk – vi kan få provision.
        </p>
      ) : null}
    </div>
  );
}
