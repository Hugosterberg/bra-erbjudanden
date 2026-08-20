import Link from "next/link";
import { Store } from "lucide-react";

import { StoreGrid } from "@/features/stores/components/store-grid";
import { groupStoresAlphabetically } from "@/features/stores/group";
import { findActiveStores } from "@/features/stores/queries";
import { findActiveOffers } from "@/features/offers/queries";
import { countStoreClicksSince, daysAgo } from "@/features/tracking/discovery-events";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Butiker med rabattkoder & erbjudanden",
  description:
    "Utforska svenska butiker och varumärken med aktuella rabatter, rabattkoder och kampanjer. Hitta bra erbjudanden från butikerna du gillar.",
  path: "/butiker",
});

export default async function StoresPage() {
  const [stores, offers, weeklyClicks] = await Promise.all([
    findActiveStores(),
    findActiveOffers(),
    countStoreClicksSince(daysAgo(7)),
  ]);

  const offerCounts = new Map<string, number>();
  for (const offer of offers) {
    if (offer.store?.id) {
      offerCounts.set(offer.store.id, (offerCounts.get(offer.store.id) ?? 0) + 1);
    }
  }

  const featured = stores.filter((store) => store.is_featured);
  const popular = [...stores]
    .sort((a, b) => {
      const clickDelta = (weeklyClicks.get(b.id) ?? 0) - (weeklyClicks.get(a.id) ?? 0);
      if (clickDelta !== 0) {
        return clickDelta;
      }
      return (offerCounts.get(b.id) ?? 0) - (offerCounts.get(a.id) ?? 0);
    })
    .slice(0, 6);
  const alphabetGroups = groupStoresAlphabetically(stores);

  // A highlight section is only useful when it is a real subset. With few
  // stores it would repeat the A–Ö list three times.
  const showFeatured = featured.length > 0 && featured.length < stores.length;
  const showPopular = popular.length < stores.length;

  return (
    <>
      <PageHeader
        eyebrow="Butiker"
        title="Butiker med erbjudanden"
        description="Samlade butiker och varumärken där du kan hitta aktuella kampanjer och rabattkoder. Bläddra A–Ö eller börja med de mest klickade."
        icon={Store}
        stats={[{ value: stores.length, label: "aktiva butiker" }]}
      />
      <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {showFeatured ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Utvalda butiker</h2>
            <StoreGrid stores={featured} />
          </div>
        ) : null}

        {showPopular ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Populära just nu</h2>
            <StoreGrid stores={popular} />
          </div>
        ) : null}

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Alla butiker A–Ö</h2>
            <nav aria-label="Hoppa till bokstav" className="mt-3 flex flex-wrap gap-2">
              {alphabetGroups.map(([letter]) => (
                <a
                  key={letter}
                  href={`#bokstav-${letter}`}
                  className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground hover:ring-primary/30"
                >
                  {letter}
                </a>
              ))}
            </nav>
          </div>
          {alphabetGroups.map(([letter, group]) => (
            <div key={letter} id={`bokstav-${letter}`} className="scroll-mt-header">
              <h3 className="mb-4 text-lg font-semibold">{letter}</h3>
              <StoreGrid stores={group} />
            </div>
          ))}
        </div>

        {stores.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
            Inga butiker är publicerade ännu.
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Saknar du en butik?{" "}
          <Link href="/partner" className="font-medium text-primary">
            Hör av dig som partner
          </Link>
          .
        </p>
      </section>
    </>
  );
}
