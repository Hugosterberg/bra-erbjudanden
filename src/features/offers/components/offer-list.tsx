import Link from "next/link";
import { ArrowUpRight, Sparkles, Store, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
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
            className="group grid gap-4 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[6.5rem_minmax(0,1fr)_13rem] lg:items-center"
          >
            <div
              className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-[1.05] group-hover:[box-shadow:0_12px_28px_-10px_oklch(0.55_0.14_150/0.55)]"
              data-numeric
            >
              <span className="text-2xl font-semibold leading-none">
                {formatDiscount(offer.discount_type, offer.discount_value)}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">
                rabatt
              </span>
            </div>

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
              </div>

              <OfferTerms terms={offer.terms} />
            </div>

            <div className="grid gap-2 text-center">
              {offer.discount_code ? (
                <CouponCodeCopyButton code={offer.discount_code} className="w-full" />
              ) : null}
              <Button asChild className="w-full whitespace-normal text-center leading-tight">
                <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
                  {formatOfferCtaLabel(offer)}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
