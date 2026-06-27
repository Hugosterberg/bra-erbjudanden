import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CouponCodeCopyButton } from "@/features/offers/components/coupon-code-copy-button";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
} from "@/features/offers/format";
import { findActiveOfferBySlug } from "@/features/offers/queries";
import { createJsonLd, createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = await findActiveOfferBySlug(slug);

  if (!offer) {
    return createMetadata({
      title: "Erbjudandet finns inte",
      description: "Erbjudandet kunde inte hittas.",
    });
  }

  return createMetadata({
    title: offer.title,
    description: offer.description,
    path: `/erbjudanden/${offer.slug}`,
  });
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = await findActiveOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {offer.is_featured ? <Badge>Utvald</Badge> : null}
            {offer.store ? <Badge variant="secondary">{offer.store.name}</Badge> : null}
            {offer.category ? <Badge variant="outline">{offer.category.name}</Badge> : null}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
            {offer.title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">{offer.description}</p>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Rabatt</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatDiscount(offer.discount_type, offer.discount_value)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gäller till</p>
            <p className="mt-1 font-medium">{formatOfferValidity(offer.ends_at)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ranking</p>
            <p className="mt-1 font-medium">#{offer.rank_position}</p>
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-lg border bg-card p-5">
        <div className="space-y-3 text-center">
          {offer.discount_code ? (
            <CouponCodeCopyButton
              code={offer.discount_code}
              className="py-3"
              codeClassName="text-xl"
            />
          ) : null}
          <Button asChild className="w-full whitespace-normal text-center leading-tight">
            <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
              {formatOfferCtaLabel(offer)}
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <AffiliateDisclosure />
        </div>
      </aside>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd({
          "@context": "https://schema.org",
          "@type": "Offer",
          name: offer.title,
          description: offer.description,
          url: `/erbjudanden/${offer.slug}`,
          availabilityEnds: offer.ends_at,
          seller: offer.store?.name,
        })}
      />
    </article>
  );
}
