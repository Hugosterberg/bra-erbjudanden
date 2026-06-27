import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferList } from "@/features/offers/components/offer-list";
import { findActiveOffers } from "@/features/offers/queries";
import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
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
    icon: ShieldCheck,
    label: "Tydlig annonsmärkning",
  },
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
  const offers = await findActiveOffers();
  const offerCount = offers.length;

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
      <section className="border-b bg-secondary/45">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:py-10">
          <div className="max-w-3xl space-y-5">
            <Badge variant="secondary" className="border border-primary/15 bg-background">
              Smarta deals utan stök
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
                Alla aktuella erbjudanden direkt på startsidan
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                En renare översikt över rabattkoder, kampanjer och deals som är
                enkla att jämföra. Mindre brus, tydligare val och mer grönt när
                något faktiskt är värt att klicka på.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Visas just nu</p>
            <p className="mt-2 text-4xl font-semibold text-primary">{offerCount}</p>
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
        </div>
      </section>

      <section id="erbjudanden" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Aktuella erbjudanden</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              Hitta bästa dealen snabbare
            </h2>
          </div>
          <AffiliateDisclosure />
        </div>

        <OfferList offers={offers} />
      </section>

      <section id="bevakning" className="border-y bg-muted/35">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="space-y-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BellRing className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-normal">
              Få ett kort urval när något riktigt bra dyker upp
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Ingen daglig spam. Bara en enkel bevakning för erbjudanden som
              förtjänar lite extra uppmärksamhet.
            </p>
          </div>
          <DealSignupForm source="homepage-bottom" />
        </div>
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
