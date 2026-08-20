import { BookOpen } from "lucide-react";

import { ArticleCard } from "@/features/editorial/components/article-card";
import { findPublishedArticles } from "@/features/editorial/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Guider – shoppingtips och säsongskampanjer",
  description:
    "Evergreen och säsongsguider från braerbjudanden.se: rabattkoder, Black Friday, mellandagsrea och hur du hittar ett bra köp.",
  path: "/guider",
});

export default async function GuidesIndexPage() {
  const articles = await findPublishedArticles({ type: "guide" });

  return (
    <>
      <PageHeader
        eyebrow="Guider"
        title="Shoppingguider utan brus"
        description="Korta, användbara texter om hur du hittar riktiga deals – inte tunt AI-innehåll skapat för att fylla URL:er."
        icon={BookOpen}
        stats={[{ value: articles.length, label: "guider" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Inga guider är publicerade ännu.
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
