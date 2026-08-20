import { Award } from "lucide-react";

import { ArticleCard } from "@/features/editorial/components/article-card";
import { findPublishedArticles } from "@/features/editorial/queries";
import { findActiveCategories } from "@/features/categories/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";
import Link from "next/link";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Bäst i test – redaktionella köpguider",
  description:
    "Redaktionella jämförelser och köpguider från braerbjudanden.se. Tydlig metod, inga påhittade tester och ranking som är vår bedömning.",
  path: "/bast-i-test",
});

export default async function BestInTestIndexPage() {
  const [articles, categories] = await Promise.all([
    findPublishedArticles({ type: "best_in_test" }),
    findActiveCategories(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Bäst i test"
        title="Köpguider med tydlig metod"
        description="Vi jämför produkter redaktionellt och märker alltid hur bedömningen är gjord. Inga fabricerade tester eller fejkade omdömen."
        icon={Award}
        stats={[{ value: articles.length, label: "publicerade guider" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {categories.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/kategorier/${category.slug}`}
                className="rounded-full bg-card px-3 py-1 text-sm ring-1 ring-foreground/10 hover:ring-primary/25"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Inga Bäst i test-guider är publicerade ännu. De dyker upp här när
            redaktionen har en jämförelse som håller för publicering.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
