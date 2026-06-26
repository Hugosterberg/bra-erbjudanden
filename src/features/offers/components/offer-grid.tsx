import { OfferCard } from "./offer-card";
import type { OfferWithRelations } from "../types";

export function OfferGrid({ offers }: { offers: OfferWithRelations[] }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <h2 className="text-lg font-semibold">Inga aktiva erbjudanden ännu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          När publicerade erbjudanden finns i Supabase visas de här.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
