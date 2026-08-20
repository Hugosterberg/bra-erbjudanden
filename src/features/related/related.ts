export type RelatedCandidate = {
  id: string;
  slug: string;
  name: string;
  categoryId?: string | null;
  storeId?: string | null;
};

export function rankRelatedItems<T extends RelatedCandidate>(input: {
  items: T[];
  currentId: string;
  categoryId?: string | null;
  storeId?: string | null;
  limit?: number;
}): T[] {
  const limit = input.limit ?? 4;

  return input.items
    .filter((item) => item.id !== input.currentId)
    .map((item) => {
      let score = 0;
      if (input.categoryId && item.categoryId === input.categoryId) {
        score += 3;
      }
      if (input.storeId && item.storeId === input.storeId) {
        score += 2;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "sv"))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function rankSimilarStores<T extends { id: string; slug: string; name: string }>(input: {
  stores: T[];
  currentId: string;
  storeCategoryIds: Map<string, string[]>;
  limit?: number;
}): T[] {
  const currentCategories = new Set(input.storeCategoryIds.get(input.currentId) ?? []);
  const limit = input.limit ?? 4;

  return input.stores
    .filter((store) => store.id !== input.currentId)
    .map((store) => {
      const overlap = (input.storeCategoryIds.get(store.id) ?? []).filter((id) =>
        currentCategories.has(id),
      ).length;
      return { store, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.store.name.localeCompare(b.store.name, "sv"))
    .slice(0, limit)
    .map((entry) => entry.store);
}

export function createPublicPath(kind: "store" | "offer" | "category" | "guide" | "review" | "best_in_test", slug: string) {
  switch (kind) {
    case "store":
      return `/butiker/${slug}`;
    case "offer":
      return `/erbjudanden/${slug}`;
    case "category":
      return `/kategorier/${slug}`;
    case "guide":
      return `/guider/${slug}`;
    case "review":
      return `/recensioner/${slug}`;
    case "best_in_test":
      return `/bast-i-test/${slug}`;
  }
}
