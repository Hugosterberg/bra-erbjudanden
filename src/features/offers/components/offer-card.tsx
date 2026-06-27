import Link from "next/link";
import { ArrowUpRight, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

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

export function OfferCard({ offer }: { offer: OfferWithRelations }) {
  return (
    <Card className="group relative h-full gap-4 overflow-hidden rounded-2xl shadow-none ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-primary/20">
      <span aria-hidden className="deal-shine z-10" />
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {offer.is_featured ? (
                <Badge className="gap-1">
                  <Sparkles className="size-3" />
                  Utvald
                </Badge>
              ) : null}
              <Badge variant="outline">{formatRedemptionType(offer.redemption_type)}</Badge>
              {offer.category ? <Badge variant="secondary">{offer.category.name}</Badge> : null}
            </div>
            <Link href={`/erbjudanden/${offer.slug}`} className="block">
              <h2 className="text-lg font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">
                {offer.title}
              </h2>
            </Link>
          </div>
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-accent px-3 py-2 text-center text-accent-foreground ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-[1.04] group-hover:[box-shadow:0_12px_28px_-10px_oklch(0.55_0.14_150/0.55)]"
            data-numeric
          >
            <p className="text-xl font-semibold leading-none">
              {formatDiscount(offer.discount_type, offer.discount_value)}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide">rabatt</p>
          </div>
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
        {offer.discount_code ? (
          <CouponCodeCopyButton code={offer.discount_code} codeClassName="text-lg" />
        ) : null}
        <Button asChild className="w-full whitespace-normal text-center leading-tight">
          <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
            {formatOfferCtaLabel(offer)}
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
