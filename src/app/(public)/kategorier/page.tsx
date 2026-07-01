import { Tags } from "lucide-react";

import { CategoryGrid } from "@/features/categories/components/category-grid";
import { findActiveCategories } from "@/features/categories/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Kategorier – hitta erbjudanden & rabatter",
  description:
    "Bläddra bland kategorier och hitta bra erbjudanden, rabatter och rabattkoder inom det du letar efter – utan att scrolla igenom allt.",
  path: "/kategorier",
});

export default async function CategoriesPage() {
  const categories = await findActiveCategories();

  return (
    <>
      <PageHeader
        eyebrow="Kategorier"
        title="Hitta rätt erbjudande snabbare"
        description="Bläddra bland kategorier för att se relevanta rabatter och kampanjer utan att scrolla igenom allt."
        icon={Tags}
        stats={[{ value: categories.length, label: "kategorier" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <CategoryGrid categories={categories} />
      </section>
    </>
  );
}
