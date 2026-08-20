import { Tag } from "lucide-react";

import { OfferCard } from "./offer-card";
import type { OfferHeadingLevel, OfferWithRelations } from "../types";

export function OfferGrid({
  offers,
  headingLevel = "h2",
}: {
  offers: OfferWithRelations[];
  headingLevel?: OfferHeadingLevel;
}) {
  const Heading = headingLevel;

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center ring-1 ring-foreground/5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Tag className="size-5" />
        </div>
        <Heading className="mt-4 text-lg font-semibold">
          Inga aktiva erbjudanden just nu
        </Heading>
        <p className="mt-2 text-sm text-muted-foreground">
          Nya deals dyker upp löpande. Bevaka så hör du av oss när det finns
          något riktigt bra.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
