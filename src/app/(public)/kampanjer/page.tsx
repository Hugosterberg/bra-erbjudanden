import { Megaphone } from "lucide-react";

import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Kampanjer",
  description:
    "Aktuella kampanjer och direktlänkar till utvalda erbjudanden från relevanta butiker.",
  path: "/kampanjer",
});

export default async function CampaignsPage() {
  const offers = await findActiveOffers({ redemptionType: "direct_link" });
  const storeCount = new Set(
    offers.map((offer) => offer.store?.id).filter(Boolean),
  ).size;

  return (
    <>
      <PageHeader
        eyebrow="Direkta kampanjer"
        title="Kampanjer"
        description="Samlade kampanjer där erbjudandet aktiveras via länk istället för rabattkod. Allt är kopplat till central klickspårning och tydlig affiliateinformation."
        icon={Megaphone}
        stats={[
          { value: offers.length, label: "aktiva kampanjer" },
          { value: storeCount, label: "butiker" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <OfferGrid offers={offers} />
        <div className="mt-8">
          <AffiliateDisclosure />
        </div>
      </section>
    </>
  );
}
