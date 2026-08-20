import Link from "next/link";
import { ArrowUpRight, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { scoreOffer } from "@/features/deal-score/from-offer";
import { StoreLogo } from "@/shared/ui/store-logo";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
import { OfferDiscountBadge } from "./offer-discount-badge";
import { OfferMedia } from "./offer-media";
import { OfferStatusBadges } from "./offer-status-badges";
import { OfferTerms } from "./offer-terms";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
} from "../format";
import type { OfferHeadingLevel, OfferWithRelations } from "../types";

export function OfferCard({
  offer,
  headingLevel = "h2",
}: {
  offer: OfferWithRelations;
  headingLevel?: OfferHeadingLevel;
}) {
  const score = scoreOffer(offer).score;
  const Heading = headingLevel;

  return (
    <Card className="group relative h-full gap-4 overflow-hidden rounded-2xl shadow-none ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-primary/20">
      <span aria-hidden className="deal-shine z-10" />
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <OfferStatusBadges offer={offer} score={score} />
            <Link href={`/erbjudanden/${offer.slug}`} className="block">
              <Heading className="text-lg font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">
                {offer.title}
              </Heading>
            </Link>
          </div>
          <OfferMedia
            imageUrl={offer.image_url}
            title={offer.title}
            discountLabel={formatDiscount(offer.discount_type, offer.discount_value)}
            className="size-28"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{offer.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
            Gäller till {formatOfferValidity(offer.ends_at)}
          </span>
        </div>
        <OfferTerms terms={offer.terms} />
      </CardContent>
      <CardFooter className="mt-auto grid gap-2">
        <OfferDiscountBadge
          discountType={offer.discount_type}
          discountValue={offer.discount_value}
          className="w-full"
        />
        {offer.discount_code ? (
          <CouponCodeCopyButton code={offer.discount_code} offerId={offer.id} />
        ) : null}
        <Button asChild className="h-auto w-full whitespace-normal py-2 text-center leading-tight">
          <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
            {formatOfferCtaLabel(offer)}
            <ArrowUpRight className="size-4 shrink-0" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
