import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveCategories } from "@/features/categories/queries";
import { findActiveStores } from "@/features/stores/queries";
import { createJsonLd, createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Dagens bästa erbjudanden",
  description:
    "Hitta handplockade erbjudanden, rabattkoder och kampanjer från svenska och internationella butiker.",
});

export default async function HomePage() {
  const [offers, stores, categories] = await Promise.all([
    findActiveOffers({ limit: 6 }),
    findActiveStores(),
    findActiveCategories(),
  ]);

  return (
    <div>
      <section className="border-b bg-muted/25">
        <div className="mx-auto grid min-h-[560px] w-full max-w-6xl content-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Transparenta rekommendationer
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Dagens bästa erbjudanden
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Spara mer utan att leta. Vi samlar relevanta rabatter,
                kampanjer och affiliateerbjudanden med tydlig ranking och
                synlig annonsmärkning.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/erbjudanden">
                  Se erbjudanden
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/butiker">Utforska butiker</Link>
              </Button>
            </div>
            <AffiliateDisclosure />
          </div>

          <div className="grid content-end gap-4">
            <div className="rounded-lg border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="font-medium">MVP-status</p>
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Erbjudanden</dt>
                  <dd className="mt-1 text-2xl font-semibold">{offers.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Butiker</dt>
                  <dd className="mt-1 text-2xl font-semibold">{stores.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Kategorier</dt>
                  <dd className="mt-1 text-2xl font-semibold">{categories.length}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border bg-background p-5">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-1 size-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">
                  Lägre rankningsvärde visas högre upp. Utvalda erbjudanden får
                  prioritet, men utgångna erbjudanden visas aldrig som aktiva.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Handplockat</p>
            <h2 className="mt-2 text-2xl font-semibold">Utvalda rabatter</h2>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/erbjudanden">
              Alla erbjudanden
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <OfferGrid offers={offers} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "braerbjudanden.se",
          url: "https://braerbjudanden.se",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://braerbjudanden.se/erbjudanden?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        })}
      />
    </div>
  );
}
