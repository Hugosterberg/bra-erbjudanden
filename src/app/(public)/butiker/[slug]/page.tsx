import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/features/editorial/components/article-card";
import { findPublishedArticles } from "@/features/editorial/queries";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { OfferList } from "@/features/offers/components/offer-list";
import { compareByDiscount, formatOfferValidity } from "@/features/offers/format";
import { findActiveOfferSummaries, findActiveOffers } from "@/features/offers/queries";
import { RelatedContent } from "@/features/related/components/related-content";
import { rankSimilarStores } from "@/features/related/related";
import { resolveStoreOutboundUrl } from "@/features/stores/outbound";
import { findActiveStoreBySlug, findActiveStores } from "@/features/stores/queries";
import { currentMarket } from "@/shared/config/market";
import { hasIndexableContent } from "@/shared/lib/indexing";
import {
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { FaqSection } from "@/shared/ui/faq-section";
import { PageHeader } from "@/shared/ui/page-header";
import { StoreLogo } from "@/shared/ui/store-logo";

export const revalidate = 300;

function formatCurrentMonth(now = new Date()) {
  return new Intl.DateTimeFormat(currentMarket.locale, { month: "long", year: "numeric" }).format(now);
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);

  if (!store) {
    return createMetadata({
      title: "Butik",
      description: "Aktuella erbjudanden från vald butik.",
      path: `/butiker/${slug}`,
      index: false,
    });
  }

  const [offers, articles] = await Promise.all([
    findActiveOffers({ storeSlug: slug }),
    findPublishedArticles({ storeId: store.id, limit: 6 }),
  ]);

  const codeCount = offers.filter((offer) => offer.discount_code).length;
  const headline = codeCount > 0 ? `Rabattkod ${store.name}` : `${store.name} erbjudanden`;
  const counts =
    offers.length > 0
      ? `${offers.length} aktiva erbjudanden${codeCount > 0 ? `, varav ${codeCount} med rabattkod` : ""}. `
      : "";

  return createMetadata({
    title: `${headline} – ${formatCurrentMonth()}`,
    description: `${counts}Aktuella rabatter och kampanjer från ${store.name}. ${store.seo_intro ?? store.description ?? ""}`
      .trim()
      .slice(0, 300),
    path: `/butiker/${slug}`,
    index: hasIndexableContent({
      offerCount: offers.length,
      articleCount: articles.length,
      intro: store.seo_intro,
      description: store.description,
    }),
  });
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const [allStores, offers, summaries, articles] = await Promise.all([
    findActiveStores(),
    findActiveOffers({ storeSlug: slug }),
    findActiveOfferSummaries(),
    findPublishedArticles({ storeId: store.id, limit: 6 }),
  ]);

  const codes = offers.filter((offer) => offer.redemption_type === "discount_code");
  const campaigns = offers.filter((offer) => offer.redemption_type === "direct_link");
  const strongest = offers.length ? [...offers].sort(compareByDiscount)[0] : null;
  const lastVerified = offers
    .flatMap((offer) => (offer.last_verified_at ? [offer.last_verified_at] : []))
    .sort()
    .at(-1);
  const relatedCategories = Array.from(
    new Map(
      offers
        .flatMap((offer) => (offer.category ? [offer.category] : []))
        .map((category) => [category.id, category]),
    ).values(),
  );
  const storeCategoryIds = new Map<string, string[]>();
  for (const item of summaries) {
    if (!item.category_id) {
      continue;
    }
    const current = storeCategoryIds.get(item.store_id) ?? [];
    if (!current.includes(item.category_id)) {
      current.push(item.category_id);
    }
    storeCategoryIds.set(item.store_id, current);
  }

  const similarStores = rankSimilarStores({
    stores: allStores,
    currentId: store.id,
    storeCategoryIds,
    limit: 4,
  });

  const faqItems = [
    {
      question: `Hur använder jag en rabattkod hos ${store.name}?`,
      answer: `Kopiera koden på braerbjudanden.se, gå vidare till ${store.name} och klistra in den i kassan innan du betalar. Läs villkoren på respektive erbjudande.`,
    },
    {
      question: `Är ${store.name}-erbjudandena aktuella?`,
      answer:
        "Vi visar bara erbjudanden inom sin giltighetstid och tar bort koder som gått ut. Kontrollera alltid priset i kassan, eftersom butiken kan ändra villkoren.",
    },
    {
      question: `Får braerbjudanden.se provision om jag handlar hos ${store.name}?`,
      answer:
        "Ja, länkar till butiker kan ge oss provision, och det kostar inget extra för dig. Sponsrade placeringar märks separat och varken de eller provisionen påverkar Deal Score.",
    },
  ];

  const hasNoOffers = offers.length === 0;
  const outboundUrl = resolveStoreOutboundUrl(store);

  return (
    <>
      <PageHeader
        eyebrow={`Uppdaterad ${formatCurrentMonth()}`}
        title={codes.length > 0 ? `Rabattkod ${store.name}` : `Erbjudanden från ${store.name}`}
        description={store.seo_intro ?? store.description ?? "Aktuella erbjudanden och kampanjer."}
        icon={Store}
        backLink={{ href: "/butiker", label: "Tillbaka till alla butiker" }}
        stats={[
          { value: offers.length, label: "aktiva erbjudanden" },
          { value: codes.length, label: "rabattkoder" },
        ]}
      />
      <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-foreground/10 sm:flex-row sm:items-center">
          <StoreLogo
            name={store.name}
            logoUrl={store.logo_url}
            websiteUrl={store.website_url}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary">Varumärke</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{store.name}</p>
            {lastVerified ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Senast kontrollerad av oss {formatOfferValidity(lastVerified)}
              </p>
            ) : null}
          </div>
          {outboundUrl ? (
            <Button variant="outline" asChild>
              <Link
                href={`/go/butik/${store.slug}`}
                rel="sponsored nofollow noopener"
                target="_blank"
              >
                Besök {store.name}
                <ExternalLink className="size-4" />
                <span className="sr-only">(öppnas i nytt fönster)</span>
              </Link>
            </Button>
          ) : null}
        </div>

        {hasNoOffers ? (
          <div className="rounded-2xl border border-dashed p-8">
            <h2 className="text-lg font-semibold">
              Inga aktiva erbjudanden hos {store.name} just nu
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vi lägger upp nya deals löpande. Under tiden hittar du liknande
              butiker längre ner, eller alla aktuella erbjudanden i listan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/erbjudanden">Se alla erbjudanden</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/butiker">Bläddra bland butiker</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {strongest ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Starkaste erbjudandet just nu</h2>
            <OfferList offers={[strongest]} headingLevel="h3" />
          </div>
        ) : null}

        {codes.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Aktiva rabattkoder</h2>
            <OfferGrid offers={codes} headingLevel="h3" />
          </div>
        ) : null}

        {campaigns.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Kampanjer</h2>
            <OfferGrid offers={campaigns} headingLevel="h3" />
          </div>
        ) : null}

        {store.saving_tips ? (
          <div className="rounded-2xl bg-muted/40 p-5">
            <h2 className="text-lg font-semibold">Spartips hos {store.name}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {store.saving_tips}
            </p>
          </div>
        ) : null}

        {relatedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((category) => (
              <Badge key={category.id} variant="secondary" asChild>
                <Link href={`/kategorier/${category.slug}`}>{category.name}</Link>
              </Badge>
            ))}
          </div>
        ) : null}

        <RelatedContent
          title="Liknande butiker"
          items={similarStores.map((item) => ({
            href: `/butiker/${item.slug}`,
            title: item.name,
          }))}
        />

        {articles.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Guider och Bäst i test</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ) : null}

        <AffiliateDisclosure />
      </section>
      <FaqSection title={`Vanliga frågor om ${store.name}`} items={faqItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Butiker", path: "/butiker" },
            { name: store.name, path: `/butiker/${store.slug}` },
          ]),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(createFaqJsonLd(faqItems))}
      />
    </>
  );
}
