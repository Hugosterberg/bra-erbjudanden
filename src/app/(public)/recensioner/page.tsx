import { Star } from "lucide-react";

import { ArticleCard } from "@/features/editorial/components/article-card";
import { findPublishedArticles } from "@/features/editorial/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Recensioner – redaktionella produktomdömen",
  description:
    "Enskilda produktrecensioner från braerbjudanden.se. Betyg är vår redaktionella bedömning och publiceras bara när innehållet faktiskt finns.",
  path: "/recensioner",
});

export default async function ReviewsIndexPage() {
  const articles = await findPublishedArticles({ type: "review" });

  return (
    <>
      <PageHeader
        eyebrow="Recensioner"
        title="Produktrecensioner"
        description="Vi recenserar bara produkter där vi har en faktisk redaktionell bedömning. Inga påhittade stjärnor eller fejkade recensionsantal."
        icon={Star}
        stats={[{ value: articles.length, label: "recensioner" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Inga recensioner är publicerade ännu.
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
