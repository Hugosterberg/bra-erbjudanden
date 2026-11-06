import type { MetadataRoute } from "next";

import { findActiveCategories } from "@/features/categories/queries";
import { findPublishedArticles } from "@/features/editorial/queries";
import { articlePublicPath } from "@/features/editorial/types";
import { findActiveOfferSummaries } from "@/features/offers/queries";
import { SEASONAL_PAGE_PATHS } from "@/features/seasonal/pages";
import { findActiveStores } from "@/features/stores/queries";
import { hasIndexableContent } from "@/shared/lib/indexing";
import { createAbsoluteUrl } from "@/shared/lib/seo";

// Without this the sitemap is frozen at build time and new stores never appear.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [offers, stores, categories, articles] = await Promise.all([
    findActiveOfferSummaries(),
    findActiveStores(),
    findActiveCategories(),
    findPublishedArticles(),
  ]);

  const offersByStore = new Map<string, number>();
  const offersByCategory = new Map<string, number>();
  for (const offer of offers) {
    offersByStore.set(offer.store_id, (offersByStore.get(offer.store_id) ?? 0) + 1);
    if (offer.category_id) {
      offersByCategory.set(offer.category_id, (offersByCategory.get(offer.category_id) ?? 0) + 1);
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

  // Must match each page's robots rule: an empty list page is noindex.
  const hasArticleOfType = (type: string) => articles.some((item) => item.article_type === type);

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/erbjudanden",
    "/rabattkoder",
    "/kampanjer",
    "/butiker",
    "/kategorier",
    ...SEASONAL_PAGE_PATHS,
    ...(hasArticleOfType("best_in_test") ? ["/bast-i-test"] : []),
    ...(hasArticleOfType("guide") ? ["/guider"] : []),
    ...(hasArticleOfType("review") ? ["/recensioner"] : []),
    "/partner",
    "/om-oss",
    "/integritetspolicy",
    "/affiliatedisclosure",
  ].map((path, index) => ({
    url: createAbsoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: index === 0 ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    // Feed offers are noindex, so only original offer pages are advertised.
    ...offers.filter((offer) => !offer.is_imported || offer.is_import_locked).map((offer) => ({
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
