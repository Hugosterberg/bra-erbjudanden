import { ArticlePage, generateArticleMetadata } from "@/features/editorial/components/article-page";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  return generateArticleMetadata({
    params,
    type: "guide",
    sectionLabel: "Guider",
    sectionPath: "/guider",
  });
}

export default async function Page({ params }: PageProps) {
  return (
    <ArticlePage
      params={params}
      type="guide"
      sectionLabel="Guider"
      sectionPath="/guider"
    />
  );
}
