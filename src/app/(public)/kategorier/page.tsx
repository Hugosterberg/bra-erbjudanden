import { CategoryGrid } from "@/features/categories/components/category-grid";
import { findActiveCategories } from "@/features/categories/queries";
import { createMetadata } from "@/shared/lib/seo";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Kategorier",
  description: "Hitta erbjudanden efter kategori.",
  path: "/kategorier",
});

export default async function CategoriesPage() {
  const categories = await findActiveCategories();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Kategorier</p>
        <h1 className="text-3xl font-semibold tracking-normal">Hitta rätt erbjudande snabbare</h1>
        <p className="leading-7 text-muted-foreground">
          Bläddra bland kategorier för att se relevanta rabatter.
        </p>
      </div>
      <CategoryGrid categories={categories} />
    </section>
  );
}
