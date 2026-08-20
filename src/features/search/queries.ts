import { findPublishedArticles } from "@/features/editorial/queries";
import { articlePublicPath } from "@/features/editorial/types";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveCategories } from "@/features/categories/queries";
import { findActiveStores } from "@/features/stores/queries";

export type SearchHit = {
  type: "offer" | "store" | "category" | "article";
  href: string;
  title: string;
  description: string;
  badge: string;
};

function matchesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query);
}

export async function searchSite(rawQuery: string): Promise<SearchHit[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) {
    return [];
  }

  const [offers, stores, categories, articles] = await Promise.all([
    findActiveOffers({ limit: 80 }),
    findActiveStores(),
    findActiveCategories(),
    findPublishedArticles({ limit: 40 }),
  ]);

  const hits: SearchHit[] = [];

  for (const offer of offers) {
    const haystack = [
      offer.title,
      offer.description,
      offer.discount_code ?? "",
      offer.store?.name ?? "",
      offer.category?.name ?? "",
    ].join(" ");
    if (!matchesQuery(haystack, query)) {
      continue;
    }
    hits.push({
      type: "offer",
      href: `/erbjudanden/${offer.slug}`,
      title: offer.title,
      description: offer.store?.name ?? offer.description,
      badge: offer.discount_code ? "Rabattkod" : "Erbjudande",
    });
  }

  for (const store of stores) {
    const haystack = [store.name, store.description ?? ""].join(" ");
    if (!matchesQuery(haystack, query)) {
      continue;
    }
    hits.push({
      type: "store",
      href: `/butiker/${store.slug}`,
      title: store.name,
      description: store.description ?? "Butik med aktuella erbjudanden",
      badge: "Butik",
    });
  }

  for (const category of categories) {
    const haystack = [category.name, category.description ?? "", category.seo_intro ?? ""].join(" ");
    if (!matchesQuery(haystack, query)) {
      continue;
    }
    hits.push({
      type: "category",
      href: `/kategorier/${category.slug}`,
      title: category.name,
      description: category.description ?? "Kategori",
      badge: "Kategori",
    });
  }

  for (const article of articles) {
    const haystack = [article.title, article.excerpt ?? "", article.body].join(" ");
    if (!matchesQuery(haystack, query)) {
      continue;
    }
    const badge =
      article.article_type === "best_in_test"
        ? "Bäst i test"
        : article.article_type === "review"
          ? "Recension"
          : "Guide";
    hits.push({
      type: "article",
      href: articlePublicPath(article),
      title: article.title,
      description: article.excerpt ?? article.category?.name ?? badge,
      badge,
    });
  }

  return hits
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(query) ? 1 : 0;
      const bStarts = b.title.toLowerCase().startsWith(query) ? 1 : 0;
      if (aStarts !== bStarts) {
        return bStarts - aStarts;
      }
      const order = { store: 0, offer: 1, category: 2, article: 3 };
      return order[a.type] - order[b.type];
    })
    .slice(0, 40);
}
