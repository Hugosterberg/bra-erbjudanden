import type { MetadataRoute } from "next";

import { findActiveCategories } from "@/features/categories/queries";
import { findPublishedArticles } from "@/features/editorial/queries";
import { articlePublicPath } from "@/features/editorial/types";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveStores } from "@/features/stores/queries";
import { hasIndexableContent } from "@/shared/lib/indexing";
import { createAbsoluteUrl } from "@/shared/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [offers, stores, categories, articles] = await Promise.all([
    findActiveOffers(),
    findActiveStores(),
    findActiveCategories(),
    findPublishedArticles(),
  ]);

  const offersByStore = new Map<string, number>();
  const offersByCategory = new Map<string, number>();
  for (const offer of offers) {
    if (offer.store?.id) {
      offersByStore.set(offer.store.id, (offersByStore.get(offer.store.id) ?? 0) + 1);
    }
    if (offer.category?.id) {
      offersByCategory.set(offer.category.id, (offersByCategory.get(offer.category.id) ?? 0) + 1);
    }
  }

  const articlesByStore = new Map<string, number>();
  const articlesByCategory = new Map<string, number>();
  for (const article of articles) {
    if (article.store_id) {
      articlesByStore.set(article.store_id, (articlesByStore.get(article.store_id) ?? 0) + 1);
    }
    if (article.category_id) {
      articlesByCategory.set(
        article.category_id,
        (articlesByCategory.get(article.category_id) ?? 0) + 1,
      );
    }
  }

  // The same rule decides the page's robots tag, so the sitemap can never
  // advertise a URL that the page itself marks as noindex.
  const indexableStores = stores.filter((store) =>
    hasIndexableContent({
      offerCount: offersByStore.get(store.id) ?? 0,
      articleCount: articlesByStore.get(store.id) ?? 0,
      intro: store.seo_intro,
      description: store.description,
    }),
  );
  const indexableCategories = categories.filter((category) =>
    hasIndexableContent({
      offerCount: offersByCategory.get(category.id) ?? 0,
      articleCount: articlesByCategory.get(category.id) ?? 0,
      intro: category.seo_intro,
      description: category.description,
    }),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/erbjudanden",
    "/rabattkoder",
    "/kampanjer",
    "/butiker",
    "/kategorier",
    "/bast-i-test",
    "/guider",
    "/recensioner",
    "/partner",
    "/affiliatedisclosure",
  ].map((path, index) => ({
    url: createAbsoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: index === 0 ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    ...offers.map((offer) => ({
      url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
      lastModified: new Date(offer.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...indexableStores.map((store) => ({
      url: createAbsoluteUrl(`/butiker/${store.slug}`),
      lastModified: new Date(store.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...indexableCategories.map((category) => ({
      url: createAbsoluteUrl(`/kategorier/${category.slug}`),
      lastModified: new Date(category.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...articles.map((article) => ({
      url: createAbsoluteUrl(articlePublicPath(article)),
      lastModified: new Date(article.updated_at),
      changeFrequency: "weekly" as const,
      priority: article.article_type === "best_in_test" ? 0.7 : 0.6,
    })),
  ];
}
