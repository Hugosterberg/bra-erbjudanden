import Link from "next/link";
import { Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
import { OfferCta } from "./offer-cta";
import { OfferDiscountBadge } from "./offer-discount-badge";
import { OfferMedia } from "./offer-media";
import { OfferTerms } from "./offer-terms";
import { StoreLogo } from "@/shared/ui/store-logo";
import { formatDealValue, formatOfferValidity, hasNumericDiscount } from "../format";
import type { OfferWithRelations } from "../types";

export function FeaturedOfferCard({ offer }: { offer: OfferWithRelations }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:ring-primary/30">
      <span aria-hidden className="deal-shine z-10" />
      <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-primary to-primary/80 px-5 py-3 text-primary-foreground">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4" />
          Erbjudande med störst rabatt
        </span>
        <span className="text-xs font-medium text-primary-foreground/80" data-numeric>
          Uppdateras löpande
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            {offer.category ? (
              <Badge variant="secondary">{offer.category.name}</Badge>
            ) : null}
            <Link href={`/erbjudanden/${offer.slug}`} className="block">
              <h3 className="line-clamp-2 text-xl font-semibold leading-7 tracking-tight hover:underline">
                {offer.title}
              </h3>
            </Link>
          </div>
          <OfferMedia
            imageUrl={offer.image_url}
            title={offer.title}
            discountLabel={formatDealValue(offer)}
              showDiscountCaption={hasNumericDiscount(offer)}
            className="size-32"
            chipTextClassName="text-2xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {offer.store ? (
            <span className="inline-flex items-center gap-1.5">
              <StoreLogo
                name={offer.store.name}
                logoUrl={offer.store.logo_url}
                websiteUrl={offer.store.website_url}
                size="sm"
              />
              {offer.store.name}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-4 text-primary" />
            {formatOfferValidity(offer.ends_at)}
          </span>
        </div>

        <OfferTerms terms={offer.terms} />

        <div className="grid gap-2">
          <OfferDiscountBadge
            offer={offer}
            className="w-full"
          />
          {offer.discount_code ? (
            <CouponCodeCopyButton code={offer.discount_code} offerId={offer.id} />
          ) : null}
          <OfferCta offer={offer} />
        </div>
      </div>
    </div>
  );
}
