import { Tag } from "lucide-react";

import { findActiveCategories } from "@/features/categories/queries";
import { OfferFilterBar } from "@/features/offers/components/offer-filter-bar";
import { OfferList } from "@/features/offers/components/offer-list";
import { findActiveOffers } from "@/features/offers/queries";
import { parseOfferSort, sortOffers, withClickCounts } from "@/features/offers/sort";
import { findActiveStores } from "@/features/stores/queries";
import { countOfferClicksSince, daysAgo } from "@/features/tracking/discovery-events";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; butik?: string; typ?: string; sortering?: string }>;
}) {
  const params = await searchParams;
  const filtered = Boolean(params.kategori || params.butik || params.typ || params.sortering);

  return createMetadata({
    title: "Erbjudanden – aktuella rabatter och deals",
    description:
      "Alla aktuella erbjudanden på braerbjudanden.se. Filtrera på kategori, butik, rabattkod eller kampanj – bara aktiva deals.",
    path: "/erbjudanden",
    index: !filtered,
  });
}

export default async function OffersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; butik?: string; typ?: string; sortering?: string }>;
}) {
  const params = await searchParams;
  const sort = parseOfferSort(params.sortering);
  const [offers, categories, stores, clickCounts] = await Promise.all([
    findActiveOffers({
      categorySlug: params.kategori,
      storeSlug: params.butik,
      redemptionType:
        params.typ === "rabattkod"
          ? "discount_code"
          : params.typ === "kampanj"
            ? "direct_link"
            : undefined,
    }),
    findActiveCategories(),
    findActiveStores(),
    countOfferClicksSince(daysAgo(7)),
  ]);

  const sorted = withClickCounts(sortOffers(offers, sort, clickCounts), clickCounts);

  return (
    <>
      <PageHeader
        eyebrow="Erbjudanden"
        title="Aktuella erbjudanden"
        description="Handplockade och importerade deals som fortfarande gäller. Filtrera efter det du faktiskt letar efter."
        icon={Tag}
        stats={[{ value: sorted.length, label: "aktiva erbjudanden" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <OfferFilterBar
          pathname="/erbjudanden"
          categories={categories}
          stores={stores}
          current={{
            category: params.kategori,
            store: params.butik,
            type: params.typ,
            sort,
          }}
        />
        <OfferList offers={sorted} />
        <div className="mt-8">
          <AffiliateDisclosure />
        </div>
      </section>
    </>
  );
}
