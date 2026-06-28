import Link from "next/link";
import { ArrowUpRight, Sparkles, Store, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
import { OfferDiscountBadge } from "./offer-discount-badge";
import { OfferMedia } from "./offer-media";
import { OfferTerms } from "./offer-terms";
import { StoreLogo } from "@/shared/ui/store-logo";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
  formatRedemptionType,
} from "../format";
import type { OfferWithRelations } from "../types";

export function OfferList({ offers }: { offers: OfferWithRelations[] }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center ring-1 ring-foreground/5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Inga aktiva erbjudanden just nu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nya deals dyker upp löpande. Bevaka så hör du av oss när det finns
          något riktigt bra.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-foreground/10">
      <ul className="divide-y divide-border/70">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="group grid gap-4 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[9.5rem_minmax(0,1fr)_17rem] lg:items-center"
          >
            <OfferMedia
              imageUrl={offer.image_url}
              title={offer.title}
              discountLabel={formatDiscount(offer.discount_type, offer.discount_value)}
              className="h-36 w-full"
              chipTextClassName="text-2xl"
            />

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {offer.is_featured ? (
                  <Badge className="gap-1">
                    <Sparkles className="size-3" />
                    Utvald
                  </Badge>
                ) : null}
                <Badge variant="secondary">{formatRedemptionType(offer.redemption_type)}</Badge>
                {offer.category ? <Badge variant="outline">{offer.category.name}</Badge> : null}
              </div>

              <Link href={`/erbjudanden/${offer.slug}`} className="block">
                <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">
                  {offer.title}
                </h2>
              </Link>

              {offer.description ? (
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {offer.description}
                </p>
              ) : null}

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
                  {formatOfferValidity(offer.ends_at)}
                </span>
                <OfferTerms terms={offer.terms} />
              </div>
            </div>

            <div className="grid gap-2 text-center">
              <OfferDiscountBadge
                discountType={offer.discount_type}
                discountValue={offer.discount_value}
                className="w-full"
              />
              {offer.discount_code ? (
                <CouponCodeCopyButton code={offer.discount_code} className="w-full" />
              ) : null}
              <Button asChild className="h-auto w-full whitespace-normal py-2 text-center leading-tight">
                <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
                  {formatOfferCtaLabel(offer)}
                  <ArrowUpRight className="size-4 shrink-0" />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
