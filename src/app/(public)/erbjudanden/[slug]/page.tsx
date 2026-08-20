import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowUpRight, Info, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CouponFeedbackButtons } from "@/features/coupon-feedback/components/coupon-feedback-buttons";
import { getCouponFeedbackSummary } from "@/features/coupon-feedback/queries";
import { DealScoreBadge } from "@/features/deal-score/components/deal-score-badge";
import { calculateDealScore } from "@/features/deal-score/score";
import { findPublishedArticles } from "@/features/editorial/queries";
import { articlePublicPath } from "@/features/editorial/types";
import { CommercialLabelBadge } from "@/features/offers/components/commercial-label-badge";
import { CouponCodeCopyButton } from "@/features/offers/components/coupon-code-copy-button";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { resolveOfferCommercialLabel } from "@/features/offers/commercial-labels";
import { isOfferActive } from "@/features/offers/expiry";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
  formatPrice,
  formatRedemptionType,
  resolveOfferPricing,
} from "@/features/offers/format";
import { findActiveOffers, findPublishedOfferBySlug } from "@/features/offers/queries";
import { RelatedContent } from "@/features/related/components/related-content";
import { recordDiscoveryEvent } from "@/features/tracking/discovery-events";
import {
  createAbsoluteUrl,
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { StoreLogo } from "@/shared/ui/store-logo";

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = await findPublishedOfferBySlug(slug);

  if (!offer) {
    return createMetadata({
      title: "Erbjudandet finns inte",
      description: "Erbjudandet kunde inte hittas.",
      index: false,
    });
  }

  const active = isOfferActive({
    status: offer.status,
    startsAt: offer.starts_at,
    endsAt: offer.ends_at,
  });

  return createMetadata({
    title: active ? offer.title : `${offer.title} (utgånget)`,
    description: offer.description,
    path: `/erbjudanden/${offer.slug}`,
    index: active,
  });
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = await findPublishedOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  const active = isOfferActive({
    status: offer.status,
    startsAt: offer.starts_at,
    endsAt: offer.ends_at,
  });

  if (active) {
    // Runs after the response is streamed. A floating promise inside render can
    // be dropped by the serverless runtime and reads headers() out of scope.
    after(async () => {
      await recordDiscoveryEvent({
        eventType: "deal_view",
        entityType: "offer",
        entityId: offer.id,
      });
    });
  }

  const [relatedOffers, articles, feedback] = await Promise.all([
    offer.store
      ? findActiveOffers({ storeSlug: offer.store.slug, limit: 8 })
      : offer.category
        ? findActiveOffers({ categorySlug: offer.category.slug, limit: 8 })
        : Promise.resolve([]),
    findPublishedArticles({
      categoryId: offer.category_id ?? undefined,
      storeId: offer.store_id,
      limit: 4,
    }),
    offer.discount_code ? getCouponFeedbackSummary(offer.id) : null,
  ]);

  const score = calculateDealScore({
    discountType: offer.discount_type,
    discountValue: offer.discount_value,
    createdAt: offer.created_at,
    updatedAt: offer.updated_at,
    lastVerifiedAt: offer.last_verified_at,
    endsAt: offer.ends_at,
    isFeatured: offer.is_featured,
    isSponsored: offer.is_sponsored,
  });
  const commercial = resolveOfferCommercialLabel(offer);
  // Only real verification signals count. Falling back to updated_at would
  // present an ordinary edit as a verification we never made.
  const verifiedAt = offer.last_verified_at ?? offer.last_synced_at;
  const pricing = resolveOfferPricing(offer);

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { href: "/", label: "Start" },
            { href: "/erbjudanden", label: "Erbjudanden" },
            { href: `/erbjudanden/${offer.slug}`, label: offer.title },
          ]}
        />
        {!active ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium">Det här erbjudandet har gått ut</p>
            <p className="mt-1 text-muted-foreground">
              URL:en finns kvar så att du kan hitta nya deals från samma butik och kategori.
            </p>
          </div>
        ) : null}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {offer.is_featured ? (
              <Badge className="gap-1">
                <Sparkles className="size-3" />
                Utvald
              </Badge>
            ) : null}
            {commercial ? <CommercialLabelBadge label={commercial} /> : null}
            {offer.store ? <Badge variant="secondary">{offer.store.name}</Badge> : null}
            {offer.category ? <Badge variant="outline">{offer.category.name}</Badge> : null}
            {active ? <DealScoreBadge score={score.score} /> : null}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {offer.title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">{offer.description}</p>
          <p className="text-xs text-muted-foreground">
            Deal Score är braerbjudandens ranking utifrån rabatt, aktualitet och
            verifiering – inte ett historiskt prisbevis.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Rabatt</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight" data-numeric>
              {formatDiscount(offer.discount_type, offer.discount_value)}
            </p>
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Gäller till</p>
            <p className="mt-1 font-medium">{formatOfferValidity(offer.ends_at)}</p>
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Typ</p>
            <p className="mt-1 font-medium">
              {formatRedemptionType(offer.redemption_type)}
            </p>
          </div>
        </div>
        {pricing ? (
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Pris</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1" data-numeric>
              <span className="text-2xl font-semibold tracking-tight">
                {formatPrice(pricing.current)}
              </span>
              {pricing.original ? (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(pricing.original)}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    Du sparar {formatPrice(pricing.savings ?? 0)}
                  </span>
                </>
              ) : null}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Priset kommer från butiken och kan ha ändrats sedan vi hämtade det.
            </p>
          </div>
        ) : null}
        {offer.terms?.trim() ? (
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Villkor</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{offer.terms}</p>
            </div>
          </div>
        ) : null}
        {offer.store ? (
          <Link
            href={`/butiker/${offer.store.slug}`}
            className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-primary/25"
          >
            <StoreLogo
              name={offer.store.name}
              logoUrl={offer.store.logo_url}
              websiteUrl={offer.store.website_url}
              size="lg"
            />
            <div>
              <p className="text-sm text-muted-foreground">Butik</p>
              <p className="font-semibold tracking-tight">{offer.store.name}</p>
            </div>
          </Link>
        ) : null}
        {relatedOffers.filter((item) => item.id !== offer.id).length > 0 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              {active ? "Fler erbjudanden" : "Nya erbjudanden från samma butik"}
            </h2>
            <OfferGrid
              offers={relatedOffers.filter((item) => item.id !== offer.id).slice(0, 3)}
              headingLevel="h3"
            />
          </div>
        ) : null}
        <RelatedContent
          title="Relaterade guider"
          items={articles.map((article) => ({
            href: articlePublicPath(article),
            title: article.title,
          }))}
        />
      </div>
      <aside className="h-fit rounded-2xl bg-card p-6 shadow-soft ring-1 ring-foreground/10">
        <div className="space-y-4 text-center">
          {offer.image_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
              <Image
                src={offer.image_url}
                alt={offer.title}
                fill
                sizes="320px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <div
            className="mx-auto flex w-fit flex-col items-center justify-center rounded-xl bg-accent px-5 py-3 text-accent-foreground ring-1 ring-primary/10"
            data-numeric
          >
            <span className="text-3xl font-semibold leading-none">
              {formatDiscount(offer.discount_type, offer.discount_value)}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">
              rabatt
            </span>
          </div>
          {active && offer.discount_code ? (
            <CouponCodeCopyButton
              code={offer.discount_code}
              offerId={offer.id}
              className="py-3"
              codeClassName="text-xl"
            />
          ) : null}
          {active ? (
            <Button asChild size="lg" className="h-11 w-full whitespace-normal text-center leading-tight">
              <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
                {formatOfferCtaLabel(offer)}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          ) : offer.store ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/butiker/${offer.store.slug}`}>Se aktuella deals från butiken</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/erbjudanden">Se aktuella erbjudanden</Link>
            </Button>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3.5 text-primary" />
            {active ? `Gäller till ${formatOfferValidity(offer.ends_at)}` : "Utgånget"}
          </div>
          <p className="text-xs text-muted-foreground">
            {verifiedAt
              ? `Senast verifierad ${formatOfferValidity(verifiedAt)}`
              : "Inte verifierad ännu"}
          </p>
          {active && offer.discount_code ? (
            <div className="text-left">
              <CouponFeedbackButtons
                offerId={offer.id}
                successLabel={feedback?.label}
              />
            </div>
          ) : null}
          <AffiliateDisclosure />
        </div>
      </aside>
      {active ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={createJsonLd({
            "@context": "https://schema.org",
            "@type": "Offer",
            name: offer.title,
            description: offer.description,
            url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
            ...(offer.image_url ? { image: offer.image_url } : {}),
            // Price is only declared when it is actually shown on the page.
            ...(pricing ? { price: pricing.current, priceCurrency: "SEK" } : {}),
            availability: "https://schema.org/InStock",
            ...(offer.starts_at ? { validFrom: offer.starts_at } : {}),
            ...(offer.ends_at ? { validThrough: offer.ends_at } : {}),
            ...(offer.store
              ? {
                  seller: {
                    "@type": "Organization",
                    name: offer.store.name,
                    url: createAbsoluteUrl(`/butiker/${offer.store.slug}`),
                  },
                }
              : {}),
          })}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Erbjudanden", path: "/erbjudanden" },
            { name: offer.title, path: `/erbjudanden/${offer.slug}` },
          ]),
        )}
      />
    </article>
  );
}
