import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Erbjudanden",
  description: "Aktuella och rankade erbjudanden med rabattkoder och kampanjer.",
  path: "/erbjudanden",
});

export default async function OffersPage() {
  const offers = await findActiveOffers();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Rankade erbjudanden</p>
        <h1 className="text-3xl font-semibold tracking-normal">Erbjudanden</h1>
        <p className="leading-7 text-muted-foreground">
          Publicerade erbjudanden sorteras efter utvald-markering, manuell
          ranking och senaste uppdatering.
        </p>
      </div>
      <OfferGrid offers={offers} />
    </section>
  );
}
