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

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: createAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...["/kampanjer", "/butiker", "/kategorier"].map((path) => ({
      url: createAbsoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...staticRoutes,
    ...offers.map((offer) => ({
      url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
      lastModified: new Date(offer.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...stores.map((store) => ({
      url: createAbsoluteUrl(`/butiker/${store.slug}`),
      lastModified: new Date(store.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...categories.map((category) => ({
      url: createAbsoluteUrl(`/kategorier/${category.slug}`),
      lastModified: new Date(category.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
