import { notFound } from "next/navigation";

import { findActiveCategoryBySlug } from "@/features/categories/queries";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findActiveCategoryBySlug(slug);

  return createMetadata({
    title: category ? `${category.name} erbjudanden` : "Kategori",
    description: category?.description ?? "Aktuella erbjudanden i vald kategori.",
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

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Kategori</p>
        <h1 className="text-3xl font-semibold tracking-normal">{category.name}</h1>
        <p className="leading-7 text-muted-foreground">
          {category.description ?? "Handplockade erbjudanden i denna kategori."}
        </p>
      </div>
      <OfferGrid offers={offers} />
    </section>
  );
}
