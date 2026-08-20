import type { Category } from "@/features/categories/types";
import type { Product } from "@/features/products/types";
import type { Store } from "@/features/stores/types";
import type { Json, Tables } from "@/shared/types/database";

export type Article = Tables<"articles">;
export type ArticleType = Article["article_type"];
export type MethodologyType = Article["methodology"];

export type ComparedProduct = {
  product_id?: string;
  name: string;
  brand?: string;
  image_url?: string;
  product_url?: string;
  current_price?: number | null;
  award?: "best_overall" | "best_value" | "premium" | "best_for";
  award_label?: string;
  editorial_score: number;
  verdict: string;
  pros: string[];
  cons: string[];
  best_for?: string;
  not_best_for?: string;
  specifications?: Record<string, string>;
};

export type ArticleWithRelations = Article & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  store: Pick<Store, "id" | "name" | "slug"> | null;
  product: Pick<Product, "id" | "name" | "slug" | "brand" | "image_url"> | null;
  compared: ComparedProduct[];
};

export function parseComparedProducts(value: Json | ComparedProduct[]): ComparedProduct[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    const score = typeof record.editorial_score === "number" ? record.editorial_score : Number(record.editorial_score);
    const verdict = typeof record.verdict === "string" ? record.verdict : "";

    if (!name || !Number.isFinite(score)) {
      return [];
    }

    return [
      {
        product_id: typeof record.product_id === "string" ? record.product_id : undefined,
        name,
        brand: typeof record.brand === "string" ? record.brand : undefined,
        image_url: typeof record.image_url === "string" ? record.image_url : undefined,
        product_url: typeof record.product_url === "string" ? record.product_url : undefined,
        current_price:
          typeof record.current_price === "number" ? record.current_price : null,
        award:
          record.award === "best_overall" ||
          record.award === "best_value" ||
          record.award === "premium" ||
          record.award === "best_for"
            ? record.award
            : undefined,
        award_label: typeof record.award_label === "string" ? record.award_label : undefined,
        editorial_score: score,
        verdict,
        pros: Array.isArray(record.pros)
          ? record.pros.filter((entry): entry is string => typeof entry === "string")
          : [],
        cons: Array.isArray(record.cons)
          ? record.cons.filter((entry): entry is string => typeof entry === "string")
          : [],
        best_for: typeof record.best_for === "string" ? record.best_for : undefined,
        not_best_for: typeof record.not_best_for === "string" ? record.not_best_for : undefined,
        specifications:
          record.specifications && typeof record.specifications === "object" && !Array.isArray(record.specifications)
            ? Object.fromEntries(
                Object.entries(record.specifications).filter(
                  (entry): entry is [string, string] => typeof entry[1] === "string",
                ),
              )
            : undefined,
      } satisfies ComparedProduct,
    ];
  });
}

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  best_in_test: "Bäst i test",
  review: "Recension",
  guide: "Guide",
};

export function articlePublicPath(article: Pick<Article, "article_type" | "slug">) {
  if (article.article_type === "best_in_test") {
    return `/bast-i-test/${article.slug}`;
  }
  if (article.article_type === "review") {
    return `/recensioner/${article.slug}`;
  }
  return `/guider/${article.slug}`;
}

export const AWARD_LABELS: Record<NonNullable<ComparedProduct["award"]>, string> = {
  best_overall: "Bäst totalt",
  best_value: "Mest prisvärd",
  premium: "Premiumval",
  best_for: "Bäst för visst behov",
};

/** award_label lets an editor name the use case behind a "Bäst för" award. */
export function formatAward(
  product: Pick<ComparedProduct, "award" | "award_label">,
  fallback = "Redaktionell bedömning",
) {
  return product.award_label ?? (product.award ? AWARD_LABELS[product.award] : fallback);
}

export function formatComparedPrice(price: number | null | undefined) {
  return typeof price === "number" ? `${Math.round(price)} kr` : "Se butik";
}
