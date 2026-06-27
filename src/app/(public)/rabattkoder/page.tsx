import { TicketPercent } from "lucide-react";

import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Rabattkoder",
  description:
    "Aktuella rabattkoder från handplockade butiker, tydligt rankade och utan utgångna erbjudanden.",
  path: "/rabattkoder",
});

export default async function DiscountCodesPage() {
  const offers = await findActiveOffers({ redemptionType: "discount_code" });
  const storeCount = new Set(
    offers.map((offer) => offer.store?.id).filter(Boolean),
  ).size;

  return (
    <>
      <PageHeader
        eyebrow="Koder som går att använda"
        title="Rabattkoder"
        description="Hitta rabattkoder där koden är synlig innan du går vidare till butiken. Vi visar bara publicerade erbjudanden som fortfarande är aktiva."
        icon={TicketPercent}
        stats={[
          { value: offers.length, label: "aktiva koder" },
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
