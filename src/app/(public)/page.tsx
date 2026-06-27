import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Sparkles,
  Store,
  Tag,
  TicketPercent,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeaturedOfferCard } from "@/features/offers/components/featured-offer-card";
import { OfferList } from "@/features/offers/components/offer-list";
import { compareByDiscount } from "@/features/offers/format";
import { findActiveOffers } from "@/features/offers/queries";
import { CategoryStrip } from "@/features/categories/components/category-strip";
import { findActiveCategories } from "@/features/categories/queries";
import { createAbsoluteUrl, createJsonLd, createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Alla aktuella erbjudanden",
  description:
    "Se alla aktiva erbjudanden, rabattkoder och kampanjer på braerbjudanden.se direkt på startsidan.",
});

const trustItems = [
  {
    icon: BadgeCheck,
    label: "Handplockad sortering",
  },
  {
    icon: CheckCircle2,
    label: "Bara aktiva erbjudanden",
  },
];

export default async function HomePage() {
  const [offers, categories] = await Promise.all([
    findActiveOffers(),
    findActiveCategories(),
  ]);
  const offerCount = offers.length;
  const featuredOffer = offers.length
    ? [...offers].sort(compareByDiscount)[0]
    : undefined;
  const partnerOffers = offers.filter((offer) => offer.is_featured);
  const otherOffers = offers.filter(
    (offer) => !offer.is_featured && offer.id !== featuredOffer?.id,
  );
  const storeCount = new Set(
    offers.map((offer) => offer.store?.id).filter(Boolean),
  ).size;
  const codeCount = offers.filter((offer) => offer.discount_code).length;

  const heroStats = [
    { icon: Tag, value: offerCount, label: "aktiva erbjudanden" },
    { icon: Store, value: storeCount, label: "butiker" },
    { icon: TicketPercent, value: codeCount, label: "rabattkoder" },
  ];

  const categoryCounts = new Map<string, number>();
  for (const offer of offers) {
    if (offer.category) {
      categoryCounts.set(
        offer.category.id,
        (categoryCounts.get(offer.category.id) ?? 0) + 1,
      );
    }
  }

  const categoriesWithCounts = categories
    .map((category) => ({
      ...category,
      offerCount: categoryCounts.get(category.id) ?? 0,
    }))
    .filter((category) => category.offerCount > 0)
    .sort((a, b) => b.offerCount - a.offerCount)
    .slice(0, 8);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Aktuella erbjudanden",
    itemListElement: offers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: offer.title,
      url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
    })),
  };

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/30">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60" />
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          <span className="animate-float-tag-a absolute top-[8%] right-[9%] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3.5 py-1.5 text-sm font-semibold text-primary shadow-soft backdrop-blur">
            <Tag className="size-3.5" />
            −50%
          </span>
          <span className="animate-float-tag-b absolute bottom-[10%] right-[24%] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3.5 py-1.5 text-sm font-semibold text-primary shadow-soft backdrop-blur">
            <TicketPercent className="size-3.5" />
            KOD
          </span>
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:py-16">
          <div className="max-w-3xl space-y-6">
            <Badge
              variant="secondary"
              className="gap-1.5 border border-primary/15 bg-background/80 py-1 pl-1.5 backdrop-blur"
            >
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-2.5" />
              </span>
              Smarta deals utan stök
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Spara mer utan att leta.{" "}
                <span className="text-gradient-primary animate-gradient-pan">
                  Handplockade
                </span>{" "}
                erbjudanden.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                En renare översikt över rabattkoder, kampanjer och deals som är
                enkla att jämföra. Mindre brus, tydligare val och bara erbjudanden
                som faktiskt är värda att klicka på.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11">
                <Link href="#erbjudanden">
                  Visa erbjudanden
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11">
                <Link href="#bevakning">
                  <BellRing className="size-4" />
                  Bevaka deals
                </Link>
              </Button>
            </div>

            <dl className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
              {heroStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="leading-tight">
                      <dt className="text-xl font-semibold tracking-tight" data-numeric>
                        {stat.value}
                      </dt>
                      <dd className="text-xs text-muted-foreground">{stat.label}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          {featuredOffer ? (
            <FeaturedOfferCard offer={featuredOffer} />
          ) : (
            <div className="rounded-2xl bg-card p-6 shadow-soft ring-1 ring-foreground/10">
              <p className="text-sm font-medium text-muted-foreground">Visas just nu</p>
              <p className="mt-2 text-5xl font-semibold text-primary" data-numeric>
                {offerCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                aktiva erbjudanden, sorterade efter utvalda kampanjer och senaste
                uppdatering.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="#erbjudanden">
                  Gå till listan
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <CategoryStrip categories={categoriesWithCounts} />

      <section id="erbjudanden" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">I samarbete</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Unika erbjudanden i samarbete med braerbjudanden.se
            </h2>
          </div>
          <AffiliateDisclosure />
        </div>

        <OfferList offers={partnerOffers} />

        {otherOffers.length > 0 ? (
          <div className="mt-12">
            <div className="mb-6">
              <p className="text-sm font-medium text-primary">Fler deals</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Andra erbjudanden
              </h2>
            </div>
            <OfferList offers={otherOffers} />
          </div>
        ) : null}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "braerbjudanden.se",
          url: createAbsoluteUrl("/"),
          potentialAction: {
            "@type": "SearchAction",
            target: createAbsoluteUrl("/erbjudanden?q={search_term_string}"),
            "query-input": "required name=search_term_string",
          },
        })}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(itemListJsonLd)}
      />
    </div>
  );
}
