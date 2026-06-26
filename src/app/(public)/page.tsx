import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findActiveCategories } from "@/features/categories/queries";
import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { findActiveStores } from "@/features/stores/queries";
import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
import { createAbsoluteUrl, createJsonLd, createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Dagens bästa erbjudanden",
  description:
    "Hitta handplockade erbjudanden, rabattkoder och kampanjer från svenska och internationella butiker.",
});

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Tydlig annonsmärkning",
    text: "Du ser alltid att affiliatelänkar kan förekomma.",
  },
  {
    icon: Clock3,
    title: "Inga utgångna deals",
    text: "Publiceringslogiken filtrerar bort erbjudanden som gått ut.",
  },
  {
    icon: BadgeCheck,
    title: "Redaktionell ranking",
    text: "Utvalda erbjudanden och manuell prioritet styr sorteringen.",
  },
];

const processItems = [
  {
    icon: Search,
    title: "Vi letar",
    text: "Butiker, kampanjer och rabattkoder samlas på ett ställe.",
  },
  {
    icon: Sparkles,
    title: "Vi väljer",
    text: "Bara relevanta erbjudanden lyfts fram och rankas tydligt.",
  },
  {
    icon: BellRing,
    title: "Du sparar",
    text: "Få ett kort urval när något bra dyker upp.",
  },
];

export default async function HomePage() {
  const [offers, stores, categories] = await Promise.all([
    findActiveOffers({ limit: 6 }),
    findActiveStores(),
    findActiveCategories(),
  ]);

  const featuredOffer = offers[0];
  const visibleCategories = categories.slice(0, 6);
  const visibleStores = stores.slice(0, 5);

  return (
    <div className="bg-background">
      <section className="border-b bg-[linear-gradient(180deg,var(--background),var(--muted))]">
        <div className="mx-auto grid min-h-[620px] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm">
              <ShieldCheck className="size-4 text-primary" />
              Smarta erbjudanden utan kupongkaos
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-6xl">
                Spara mer utan att leta överallt
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                En lugnare svensk erbjudandesajt med handplockade rabatter,
                transparent affiliateinformation och tydliga val när det
                faktiskt finns något bra att hämta.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/erbjudanden">
                  Se dagens erbjudanden
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#bevakning">Få erbjudanden först</Link>
              </Button>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 leading-5 text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="border-b bg-muted/40 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Live-urval</p>
                    <h2 className="mt-1 text-xl font-semibold">Bäst just nu</h2>
                  </div>
                  <Badge variant="secondary">Uppdateras löpande</Badge>
                </div>
              </div>
              <div className="p-5">
                {featuredOffer ? (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {featuredOffer.store?.name ?? "Utvald butik"}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold leading-tight">
                          {featuredOffer.title}
                        </h3>
                      </div>
                      <div className="rounded-md border bg-background px-3 py-2 text-center">
                        <CircleDollarSign className="mx-auto size-5 text-primary" />
                        <p className="mt-1 text-xs text-muted-foreground">Spara</p>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {featuredOffer.description}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/go/${featuredOffer.id}`} rel="sponsored nofollow">
                        Visa erbjudande
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border border-dashed bg-background p-5">
                      <p className="font-medium">Redo för första dealen</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        När du publicerar erbjudanden i adminpanelen blir detta
                        en fokuserad showcase för bästa aktuella kampanjen.
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/erbjudanden">Gå till erbjudanden</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div id="bevakning" className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <BellRing className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Få bättre deals i inkorgen</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Ett kort urval när något är värt att agera på.
                  </p>
                </div>
              </div>
              <DealSignupForm source="homepage-hero" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {processItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-4 rounded-lg border bg-card p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Handplockat</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Utvalda rabatter</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Starta här när du vill hitta det som är värt tiden först.
            </p>
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

      <section className="border-y bg-muted/35">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-primary">Hitta snabbare</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Utforska efter kategori och butik
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              När innehållet växer hjälper dessa ingångar besökaren att gå från
              nyfiken till klick utan onödiga filter.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Tags className="size-4 text-primary" />
                <h3 className="font-semibold">Populära kategorier</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleCategories.length > 0 ? (
                  visibleCategories.map((category) => (
                    <Button key={category.id} variant="outline" size="sm" asChild>
                      <Link href={`/kategorier/${category.slug}`}>{category.name}</Link>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Kategorier visas här när de skapats i adminpanelen.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <h3 className="font-semibold">Butiker att bevaka</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleStores.length > 0 ? (
                  visibleStores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/butiker/${store.slug}`}
                      className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm transition hover:border-foreground/20"
                    >
                      <span>{store.name}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Butiker visas här när de skapats i adminpanelen.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 rounded-lg border bg-card p-6 shadow-sm lg:grid-cols-[1fr_420px] lg:p-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              Bygg en bättre dealrutin
            </Badge>
            <h2 className="text-3xl font-semibold tracking-normal">
              Vill du slippa kolla fem sajter varje vecka?
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Skriv upp dig så kan braerbjudanden.se bli en mer personlig
              bevakning över tid. Första versionen samlar bara e-postadressen,
              men datamodellen är redo för segmentering senare.
            </p>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Inga kundkonton krävs
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Sparas tryggt i Supabase
              </p>
            </div>
          </div>
          <DealSignupForm source="homepage-bottom" />
        </div>
        <div className="mt-5">
          <AffiliateDisclosure />
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
    </div>
  );
}
