import Link from "next/link";
import { ArrowUpRight, Copy, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import { formatDiscount, formatOfferValidity } from "../format";
import type { OfferWithRelations } from "../types";

export function OfferCard({ offer }: { offer: OfferWithRelations }) {
  return (
    <Card className="h-full gap-4 rounded-lg border-border/80 shadow-none transition hover:border-foreground/20">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {offer.is_featured ? <Badge>Utvald</Badge> : null}
              {offer.category ? <Badge variant="secondary">{offer.category.name}</Badge> : null}
            </div>
            <Link href={`/erbjudanden/${offer.slug}`} className="block">
              <h2 className="text-lg font-semibold leading-6 tracking-normal hover:underline">
                {offer.title}
              </h2>
            </Link>
          </div>
          <div className="rounded-md border bg-muted px-3 py-2 text-center">
            <p className="text-xl font-semibold">{formatDiscount(offer.discount_type, offer.discount_value)}</p>
            <p className="text-[11px] uppercase text-muted-foreground">rabatt</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{offer.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {offer.store ? <span>{offer.store.name}</span> : null}
          <span className="inline-flex items-center gap-1">
            <Timer className="size-4" />
            Gäller till {formatOfferValidity(offer.ends_at)}
          </span>
        </div>
        {offer.discount_code ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
            <span className="font-mono text-sm">{offer.discount_code}</span>
            <Copy className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
            Visa erbjudande
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
