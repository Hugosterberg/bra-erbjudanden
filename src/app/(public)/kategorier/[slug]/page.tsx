import { notFound } from "next/navigation";
import { Tags } from "lucide-react";

import { findActiveCategoryBySlug } from "@/features/categories/queries";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import {
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findActiveCategoryBySlug(slug);

  return createMetadata({
    title: category ? `${category.name} – erbjudanden & rabatter` : "Kategori",
    description: category
      ? `Bra erbjudanden, rabatter och rabattkoder inom ${category.name.toLowerCase()}. ${category.description ?? "Handplockade deals – alltid aktiva."}`
      : "Aktuella erbjudanden i vald kategori.",
    path: `/kategorier/${slug}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findActiveCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const offers = await findActiveOffers({ categorySlug: slug });
  const storeCount = new Set(
    offers.map((offer) => offer.store?.id).filter(Boolean),
  ).size;

  return (
    <>
      <PageHeader
        eyebrow="Kategori"
        title={category.name}
        description={category.description ?? "Handplockade erbjudanden i denna kategori."}
        icon={Tags}
        stats={[
          { value: offers.length, label: "aktiva erbjudanden" },
          { value: storeCount, label: "butiker" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <OfferGrid offers={offers} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Kategorier", path: "/kategorier" },
            { name: category.name, path: `/kategorier/${category.slug}` },
          ]),
        )}
      />
    </>
  );
}
