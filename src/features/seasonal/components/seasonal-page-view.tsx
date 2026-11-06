import { CalendarDays } from "lucide-react";

import { OfferList } from "@/features/offers/components/offer-list";
import { compareByDiscount } from "@/features/offers/format";
import { findActiveOffers } from "@/features/offers/queries";
import { createBreadcrumbJsonLd, createJsonLd } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { FaqSection } from "@/shared/ui/faq-section";
import { PageHeader } from "@/shared/ui/page-header";

import { matchesSeasonalKeywords, type SeasonalPage } from "../pages";

const FALLBACK_OFFER_COUNT = 12;

export async function SeasonalPageView({ page }: { page: SeasonalPage }) {
  const offers = await findActiveOffers();
  const campaignOffers = offers.filter((offer) => matchesSeasonalKeywords(offer, page.keywords));
  // Outside the campaign the page stays useful without claiming that ordinary
  // offers belong to it, which is why the two lists have different headings.
  const fallback = [...offers].sort(compareByDiscount).slice(0, FALLBACK_OFFER_COUNT);
  const hasCampaignOffers = campaignOffers.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        icon={CalendarDays}
      />
      <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <AffiliateDisclosure />
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            {hasCampaignOffers ? "Kampanjerbjudanden just nu" : "Starkaste erbjudandena just nu"}
          </h2>
          {!hasCampaignOffers ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Inga erbjudanden är märkta med den här kampanjen ännu. Tills dess visar vi de
              erbjudanden som har störst rabatt just nu.
            </p>
          ) : null}
          <OfferList offers={hasCampaignOffers ? campaignOffers : fallback} headingLevel="h3" />
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">Så handlar du smart</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {page.tips.map((tip) => (
              <article key={tip.title} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                <h3 className="font-semibold">{tip.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{tip.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FaqSection title={`Vanliga frågor: ${page.title.split(" – ")[0]}`} items={page.faq} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: page.title.split(" – ")[0], path: page.path },
          ]),
        )}
      />
    </>
  );
}
