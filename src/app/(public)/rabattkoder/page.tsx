import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Rabattkoder",
  description:
    "Aktuella rabattkoder från handplockade butiker, tydligt rankade och utan utgångna erbjudanden.",
  path: "/rabattkoder",
});

export default async function DiscountCodesPage() {
  const offers = await findActiveOffers({ redemptionType: "discount_code" });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Koder som går att använda</p>
        <h1 className="text-3xl font-semibold tracking-normal">Rabattkoder</h1>
        <p className="leading-7 text-muted-foreground">
          Hitta rabattkoder där koden är synlig innan du går vidare till
          butiken. Vi visar bara publicerade erbjudanden som fortfarande är
          aktiva.
        </p>
      </div>
      <OfferGrid offers={offers} />
      <div className="mt-8">
        <AffiliateDisclosure />
      </div>
    </section>
  );
}
