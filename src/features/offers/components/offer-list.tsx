import Link from "next/link";
import { ArrowUpRight, Store, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CouponCodeCopyButton } from "./coupon-code-copy-button";
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
      <div className="rounded-lg border border-dashed bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Inga aktiva erbjudanden ännu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          När publicerade erbjudanden finns i Supabase visas de här.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <ul className="divide-y">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="grid gap-4 p-4 transition hover:bg-muted/35 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[6.5rem_minmax(0,1fr)_13rem] lg:items-center"
          >
            <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-lg border bg-accent text-accent-foreground">
              <span className="text-2xl font-semibold leading-none">
                {formatDiscount(offer.discount_type, offer.discount_value)}
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase">rabatt</span>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {offer.is_featured ? <Badge>Utvald</Badge> : null}
                <Badge variant="secondary">{formatRedemptionType(offer.redemption_type)}</Badge>
                {offer.category ? <Badge variant="outline">{offer.category.name}</Badge> : null}
              </div>

              <Link href={`/erbjudanden/${offer.slug}`} className="block">
                <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-normal hover:underline">
                  {offer.title}
                </h2>
              </Link>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {offer.store ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="size-4 text-primary" />
                    {offer.store.name}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="size-4 text-primary" />
                  {formatOfferValidity(offer.ends_at)}
                </span>
              </div>
            </div>

            <div className="grid gap-2 text-center">
              {offer.discount_code ? (
                <CouponCodeCopyButton
                  code={offer.discount_code}
                  className="w-full"
                  codeClassName="text-lg"
                />
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
