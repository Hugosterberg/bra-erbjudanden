import { notFound } from "next/navigation";

import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveStoreBySlug } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);

  return createMetadata({
    title: store ? `${store.name} erbjudanden` : "Butik",
    description: store?.description ?? "Aktuella erbjudanden från vald butik.",
    path: `/butiker/${slug}`,
  });
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const offers = await findActiveOffers({ storeSlug: slug });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Butik</p>
        <h1 className="text-3xl font-semibold tracking-normal">{store.name}</h1>
        <p className="leading-7 text-muted-foreground">
          {store.description ?? "Aktuella erbjudanden och kampanjer."}
        </p>
      </div>
      <OfferGrid offers={offers} />
    </section>
  );
}
