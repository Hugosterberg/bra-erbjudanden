import type { MetadataRoute } from "next";

import { findActiveCategories } from "@/features/categories/queries";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveStores } from "@/features/stores/queries";
import { createAbsoluteUrl } from "@/shared/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [offers, stores, categories] = await Promise.all([
    findActiveOffers(),
    findActiveStores(),
    findActiveCategories(),
  ]);

  const staticRoutes = ["", "/erbjudanden", "/butiker", "/kategorier"].map((path) => ({
    url: createAbsoluteUrl(path),
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...offers.map((offer) => ({
      url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
      lastModified: new Date(offer.updated_at),
    })),
    ...stores.map((store) => ({
      url: createAbsoluteUrl(`/butiker/${store.slug}`),
      lastModified: new Date(store.updated_at),
    })),
    ...categories.map((category) => ({
      url: createAbsoluteUrl(`/kategorier/${category.slug}`),
      lastModified: new Date(category.updated_at),
    })),
  ];
}
