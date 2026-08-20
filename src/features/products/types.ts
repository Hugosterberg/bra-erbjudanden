import type { Category } from "@/features/categories/types";
import type { Tables } from "@/shared/types/database";

export type Product = Tables<"products">;

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
};
