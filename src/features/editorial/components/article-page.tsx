import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonTable } from "@/features/editorial/components/comparison-table";
import { MethodologyBox } from "@/features/editorial/components/methodology-box";
import { ProductRating } from "@/features/editorial/components/product-rating";
import { ProsCons } from "@/features/editorial/components/pros-cons";
import { findPublishedArticleBySlug, findPublishedArticles } from "@/features/editorial/queries";
import { articlePublicPath, formatAward } from "@/features/editorial/types";
import { findActiveOffers } from "@/features/offers/queries";
import { RelatedContent } from "@/features/related/components/related-content";
import { rankRelatedItems } from "@/features/related/related";
import {
  createAbsoluteUrl,
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
  type: "best_in_test" | "review" | "guide";
  sectionLabel: string;
  sectionPath: string;
};

export async function generateArticleMetadata({ params, type, sectionLabel, sectionPath }: ArticlePageProps) {
  const { slug } = await params;
  const article = await findPublishedArticleBySlug(slug, type);

  if (!article) {
    return createMetadata({
      title: `${sectionLabel} saknas`,
      description: "Artikeln kunde inte hittas.",
      path: `${sectionPath}/${slug}`,
      index: false,
    });
  }

  return createMetadata({
    title: article.title,
    description: article.excerpt ?? article.verdict ?? article.body.slice(0, 150),
    path: articlePublicPath(article),
  });
}

export async function ArticlePage({ params, type, sectionLabel, sectionPath }: ArticlePageProps) {
  const { slug } = await params;
  const article = await findPublishedArticleBySlug(slug, type);

  if (!article) {
    notFound();
  }

  const [relatedArticles, relatedOffers] = await Promise.all([
    findPublishedArticles({
      type,
      categoryId: article.category_id ?? undefined,
      limit: 8,
    }),
    article.category_id
      ? findActiveOffers({ categoryId: article.category_id, limit: 6 })
      : article.store_id
        ? findActiveOffers({ storeId: article.store_id, limit: 6 })
        : Promise.resolve([]),
  ]);

  const related = rankRelatedItems({
    items: relatedArticles.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      categoryId: item.category_id,
      storeId: item.store_id,
    })),
    currentId: article.id,
    categoryId: article.category_id,
    storeId: article.store_id,
  });

  const updated = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
  }).format(new Date(article.updated_at));

  const canEmitReviewSchema =
    type === "review" &&
    article.editorial_score !== null &&
    Boolean(article.verdict) &&
    article.methodology !== "compared_from_sources";

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: sectionPath, label: sectionLabel },
          { href: articlePublicPath(article), label: article.title },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{sectionLabel}</Badge>
        {article.is_sponsored ? <Badge variant="outline">Sponsrat</Badge> : null}
        {article.category ? (
          <Badge variant="outline">{article.category.name}</Badge>
        ) : null}
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Senast uppdaterad {updated} · {article.author_name}
      </p>
      {article.excerpt ? (
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.excerpt}</p>
      ) : null}

      <div className="mt-6">
        <MethodologyBox methodology={article.methodology} />
      </div>

      {article.compared.length > 0 ? (
        <div className="mt-8">
          <ComparisonTable products={article.compared} />
        </div>
      ) : null}

      {article.editorial_score !== null ? (
        <div className="mt-6 flex items-center gap-3">
          <ProductRating score={article.editorial_score} />
          <span className="text-sm text-muted-foreground">Redaktionellt betyg</span>
        </div>
      ) : null}

      {article.verdict ? (
        <p className="mt-6 rounded-xl bg-muted/40 p-4 text-sm leading-7">{article.verdict}</p>
      ) : null}

      <div className="mt-8 space-y-4 text-base leading-8 whitespace-pre-line">{article.body}</div>

      <div className="mt-8">
        <ProsCons pros={article.pros} cons={article.cons} />
      </div>

      {(article.best_for || article.not_best_for) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {article.best_for ? (
            <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="text-sm font-semibold">Passar dig som</h2>
              <p className="mt-2 text-sm text-muted-foreground">{article.best_for}</p>
            </div>
          ) : null}
          {article.not_best_for ? (
            <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="text-sm font-semibold">Passar mindre bra om</h2>
              <p className="mt-2 text-sm text-muted-foreground">{article.not_best_for}</p>
            </div>
          ) : null}
        </div>
      )}

      {article.compared.length > 0 ? (
        <div className="mt-10 space-y-6">
          {article.compared.map((product) => (
            <section key={product.name} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {product.brand ? `${product.brand} ` : ""}
                    {product.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatAward(product)}
                  </p>
                </div>
                <ProductRating score={product.editorial_score} />
              </div>
              {product.image_url ? (
                <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{product.verdict}</p>
              <div className="mt-4">
                <ProsCons pros={product.pros} cons={product.cons} />
              </div>
              {product.product_url ? (
                <Button asChild className="mt-4" variant="outline">
                  <a href={product.product_url} rel="sponsored nofollow">
                    Se aktuellt pris
                  </a>
                </Button>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      <div className="mt-10 space-y-8">
        <RelatedContent
          title="Relaterade artiklar"
          items={related.map((item) => ({
            href: articlePublicPath({ article_type: type, slug: item.slug }),
            title: item.name,
          }))}
        />
        <RelatedContent
          title="Relaterade erbjudanden"
          items={relatedOffers.slice(0, 4).map((offer) => ({
            href: `/erbjudanden/${offer.slug}`,
            title: offer.title,
            description: offer.store?.name,
          }))}
        />
        {article.store ? (
          <p className="text-sm">
            Relaterad butik:{" "}
            <Link className="font-medium text-primary" href={`/butiker/${article.store.slug}`}>
              {article.store.name}
            </Link>
          </p>
        ) : null}
        {article.category ? (
          <p className="text-sm">
            Kategori:{" "}
            <Link className="font-medium text-primary" href={`/kategorier/${article.category.slug}`}>
              {article.category.name}
            </Link>
          </p>
        ) : null}
        <AffiliateDisclosure />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt ?? article.verdict,
          mainEntityOfPage: createAbsoluteUrl(articlePublicPath(article)),
          ...(article.published_at ? { datePublished: article.published_at } : {}),
          dateModified: article.updated_at,
          ...(article.featured_image_url ? { image: article.featured_image_url } : {}),
          author: { "@type": "Organization", name: article.author_name },
          publisher: { "@id": createAbsoluteUrl("/#organization") },
        })}
      />
      {canEmitReviewSchema && article.product ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={createJsonLd({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: {
              "@type": "Product",
              name: article.product.name,
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: article.editorial_score,
              bestRating: 10,
              worstRating: 0,
            },
            reviewBody: article.verdict,
            author: { "@type": "Organization", name: article.author_name },
          })}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: sectionLabel, path: sectionPath },
            { name: article.title, path: articlePublicPath(article) },
          ]),
        )}
      />
    </article>
  );
}
