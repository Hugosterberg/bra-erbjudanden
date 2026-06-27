import { Tag } from "lucide-react";

import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Erbjudanden",
  description: "Aktuella och rankade erbjudanden med rabattkoder och kampanjer.",
  path: "/erbjudanden",
});

export default async function OffersPage() {
  const offers = await findActiveOffers();
  const codeCount = offers.filter((offer) => offer.discount_code).length;
  const featuredCount = offers.filter((offer) => offer.is_featured).length;

  return (
    <>
      <PageHeader
        eyebrow="Rankade erbjudanden"
        title="Erbjudanden"
        description="Publicerade erbjudanden sorteras efter utvald-markering, manuell ranking och senaste uppdatering."
        icon={Tag}
        stats={[
          { value: offers.length, label: "aktiva erbjudanden" },
          { value: codeCount, label: "rabattkoder" },
          { value: featuredCount, label: "utvalda" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <AffiliateDisclosure />
        </div>
        <OfferGrid offers={offers} />
      </section>
    </>
  );
}
