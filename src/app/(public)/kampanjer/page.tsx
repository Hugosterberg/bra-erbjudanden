import { OfferGrid } from "@/features/offers/components/offer-grid";
import { findActiveOffers } from "@/features/offers/queries";
import { NewsletterSignupPanel } from "@/features/subscribers/components/newsletter-signup-panel";
import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Kampanjer",
  description:
    "Aktuella kampanjer och direktlänkar till utvalda erbjudanden från relevanta butiker.",
  path: "/kampanjer",
});

export default async function CampaignsPage() {
  const offers = await findActiveOffers({ redemptionType: "direct_link" });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Direkta kampanjer</p>
        <h1 className="text-3xl font-semibold tracking-normal">Kampanjer</h1>
        <p className="leading-7 text-muted-foreground">
          Samlade kampanjer där erbjudandet aktiveras via länk istället för
          rabattkod. Allt är kopplat till central klickspårning och tydlig
          affiliateinformation.
        </p>
      </div>
      <OfferGrid offers={offers} />
      <div className="mt-10">
        <NewsletterSignupPanel
          source="campaigns-page"
          title="Bevaka nya kampanjer"
          text="Skriv upp dig så missar du inte när en ny kampanj blir värd att lyfta."
        />
      </div>
      <div className="mt-8">
        <AffiliateDisclosure />
      </div>
    </section>
  );
}
