import { ArticlePage, generateArticleMetadata } from "@/features/editorial/components/article-page";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  return generateArticleMetadata({
    params,
    type: "best_in_test",
    sectionLabel: "Bäst i test",
    sectionPath: "/bast-i-test",
  });
}

export default async function Page({ params }: PageProps) {
  return (
    <ArticlePage
      params={params}
      type="best_in_test"
      sectionLabel="Bäst i test"
      sectionPath="/bast-i-test"
    />
  );
}
