import { TicketPercent } from "lucide-react";

import { OfferFilterBar } from "@/features/offers/components/offer-filter-bar";
import { OfferList } from "@/features/offers/components/offer-list";
import { findActiveOffers } from "@/features/offers/queries";
import { parseOfferSort, sortOffers, withClickCounts } from "@/features/offers/sort";
import { findActiveCategories } from "@/features/categories/queries";
import { countOfferClicksSince, daysAgo } from "@/features/tracking/discovery-events";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sortering?: string }>;
}) {
  const params = await searchParams;
  const filtered = Boolean(params.kategori || params.sortering);

  return createMetadata({
    title: "Rabattkoder – aktuella koder från svenska butiker",
    description:
      "Aktuella rabattkoder som du kan kopiera och använda i kassan. Vi visar bara koder som fortfarande är aktiva, med villkor och utgångsdatum.",
    path: "/rabattkoder",
    index: !filtered,
  });
}

export default async function DiscountCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sortering?: string }>;
}) {
  const params = await searchParams;
  const sort = parseOfferSort(params.sortering);
  const [offers, categories, clickCounts] = await Promise.all([
    findActiveOffers({
      redemptionType: "discount_code",
      categorySlug: params.kategori,
    }),
    findActiveCategories(),
    countOfferClicksSince(daysAgo(7)),
  ]);
  const sorted = withClickCounts(sortOffers(offers, sort, clickCounts), clickCounts);

  return (
    <>
      <PageHeader
        eyebrow="Rabattkoder"
        title="Rabattkoder som fortfarande gäller"
        description="Kopiera koden, gå till butiken och klistra in den i kassan. Varje kod visar villkor och hur länge den gäller."
        icon={TicketPercent}
        stats={[{ value: sorted.length, label: "aktiva rabattkoder" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <OfferFilterBar
          pathname="/rabattkoder"
          categories={categories}
          showTypeFilter={false}
          current={{ category: params.kategori, sort }}
        />
        <OfferList offers={sorted} />
        <div className="mt-8">
          <AffiliateDisclosure />
        </div>
      </section>
    </>
  );
}
