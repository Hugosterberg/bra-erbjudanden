import Link from "next/link";
import { ArrowUpRight, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
import { OfferMedia } from "./offer-media";
import { OfferTerms } from "./offer-terms";
import { StoreLogo } from "@/shared/ui/store-logo";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
} from "../format";
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
            discountLabel={formatDiscount(offer.discount_type, offer.discount_value)}
            className="size-24"
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
          {offer.discount_code ? (
            <CouponCodeCopyButton code={offer.discount_code} codeClassName="text-lg" />
          ) : null}
          <Button
            asChild
            size="lg"
            className="relative h-11 w-full overflow-hidden whitespace-normal text-center leading-tight"
          >
            <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/button:translate-x-full"
              />
              {formatOfferCtaLabel(offer)}
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
