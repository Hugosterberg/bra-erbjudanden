import { notFound } from "next/navigation";
import { Store } from "lucide-react";

import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveStoreBySlug } from "@/features/stores/queries";
import {
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";
import { StoreLogo } from "@/shared/ui/store-logo";

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);

  return createMetadata({
    title: store
      ? `${store.name} rabattkoder & erbjudanden`
      : "Butik",
    description: store
      ? `Aktuella rabatter, rabattkoder och kampanjer från ${store.name}. ${store.description ?? "Handplockade erbjudanden – alltid aktiva."}`
      : "Aktuella erbjudanden från vald butik.",
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
  const codeCount = offers.filter((offer) => offer.discount_code).length;

  return (
    <>
      <PageHeader
        eyebrow="Butik"
        title={store.name}
        description={store.description ?? "Aktuella erbjudanden och kampanjer."}
        icon={Store}
        backLink={{ href: "/butiker", label: "Tillbaka till alla butiker" }}
        stats={[
          { value: offers.length, label: "aktiva erbjudanden" },
          { value: codeCount, label: "rabattkoder" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-foreground/10">
          <StoreLogo
            name={store.name}
            logoUrl={store.logo_url}
            websiteUrl={store.website_url}
            size="lg"
          />
          <div>
            <p className="text-sm font-medium text-primary">Varumärke</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{store.name}</p>
          </div>
        </div>
        <OfferGrid offers={offers} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Butiker", path: "/butiker" },
            { name: store.name, path: `/butiker/${store.slug}` },
          ]),
        )}
      />
    </>
  );
}
