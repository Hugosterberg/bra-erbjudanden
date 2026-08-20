import Link from "next/link";
import { notFound } from "next/navigation";
import { Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { findActiveCategoryBySlug } from "@/features/categories/queries";
import { ArticleCard } from "@/features/editorial/components/article-card";
import { findPublishedArticles } from "@/features/editorial/queries";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { RelatedContent } from "@/features/related/components/related-content";
import { findActiveStores } from "@/features/stores/queries";
import { hasIndexableContent } from "@/shared/lib/indexing";
import {
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { PageHeader } from "@/shared/ui/page-header";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findActiveCategoryBySlug(slug);

  if (!category) {
    return createMetadata({
      title: "Kategori",
      description: "Aktuella erbjudanden i vald kategori.",
      path: `/kategorier/${slug}`,
      index: false,
    });
  }

  const [offers, articles] = await Promise.all([
    findActiveOffers({ categorySlug: slug }),
    findPublishedArticles({ categoryId: category.id }),
  ]);

  return createMetadata({
    title: `${category.name} – erbjudanden & rabatter`,
    description: `Bra erbjudanden, rabatter och rabattkoder inom ${category.name.toLowerCase()}. ${category.seo_intro ?? category.description ?? "Handplockade deals – alltid aktiva."}`,
    path: `/kategorier/${slug}`,
    index: hasIndexableContent({
      offerCount: offers.length,
      articleCount: articles.length,
      intro: category.seo_intro,
      description: category.description,
    }),
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findActiveCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [offers, stores, bestInTest, guides] = await Promise.all([
    findActiveOffers({ categorySlug: slug }),
    findActiveStores(),
    findPublishedArticles({ type: "best_in_test", categoryId: category.id, limit: 4 }),
    findPublishedArticles({ type: "guide", categoryId: category.id, limit: 4 }),
  ]);

  const codes = offers.filter((offer) => offer.redemption_type === "discount_code");
  const campaigns = offers.filter((offer) => offer.redemption_type === "direct_link");
  const storeIds = new Set(offers.map((offer) => offer.store?.id).filter(Boolean));
  const categoryStores = stores.filter((store) => storeIds.has(store.id));

  return (
    <>
      <PageHeader
        eyebrow="Kategori"
        title={category.name}
        description={
          category.seo_intro ??
          category.description ??
          "Handplockade erbjudanden i denna kategori."
        }
        icon={Tags}
        stats={[
          { value: offers.length, label: "aktiva erbjudanden" },
          { value: categoryStores.length, label: "butiker" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {codes.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Rabattkoder</h2>
            <OfferGrid offers={codes} headingLevel="h3" />
          </div>
        ) : null}
        {campaigns.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Kampanjer</h2>
            <OfferGrid offers={campaigns} headingLevel="h3" />
          </div>
        ) : null}
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8">
            <h2 className="text-lg font-semibold">
              Inga aktiva erbjudanden i {category.name} just nu
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nya deals tillkommer löpande. Titta under alla erbjudanden så
              länge, eller bläddra bland butikerna.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/erbjudanden">Se alla erbjudanden</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/kategorier">Alla kategorier</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <RelatedContent
          title="Populära butiker i kategorin"
          items={categoryStores.slice(0, 8).map((store) => ({
            href: `/butiker/${store.slug}`,
            title: store.name,
            description: store.description ?? undefined,
          }))}
        />

        {bestInTest.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Bäst i test</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {bestInTest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ) : null}

        {guides.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Guider</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {guides.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ) : null}

        <AffiliateDisclosure />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Kategorier", path: "/kategorier" },
            { name: category.name, path: `/kategorier/${category.slug}` },
          ]),
        )}
      />
    </>
  );
}
