import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Info, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CouponCodeCopyButton } from "@/features/offers/components/coupon-code-copy-button";
import {
  formatDiscount,
  formatOfferCtaLabel,
  formatOfferValidity,
  formatRedemptionType,
} from "@/features/offers/format";
import { findActiveOfferBySlug } from "@/features/offers/queries";
import {
  createAbsoluteUrl,
  createBreadcrumbJsonLd,
  createJsonLd,
  createMetadata,
} from "@/shared/lib/seo";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";
import { StoreLogo } from "@/shared/ui/store-logo";

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
            {offer.is_featured ? (
              <Badge className="gap-1">
                <Sparkles className="size-3" />
                Utvald
              </Badge>
            ) : null}
            {offer.store ? <Badge variant="secondary">{offer.store.name}</Badge> : null}
            {offer.category ? <Badge variant="outline">{offer.category.name}</Badge> : null}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {offer.title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">{offer.description}</p>
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
          {offer.discount_code ? (
            <CouponCodeCopyButton
              code={offer.discount_code}
              offerId={offer.id}
              className="py-3"
              codeClassName="text-xl"
            />
          ) : null}
          <Button asChild size="lg" className="h-11 w-full whitespace-normal text-center leading-tight">
            <Link href={`/go/${offer.id}`} rel="sponsored nofollow">
              {formatOfferCtaLabel(offer)}
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3.5 text-primary" />
            Gäller till {formatOfferValidity(offer.ends_at)}
          </div>
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
          url: createAbsoluteUrl(`/erbjudanden/${offer.slug}`),
          ...(offer.image_url ? { image: offer.image_url } : {}),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLd(
          createBreadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Erbjudanden", path: "/#erbjudanden" },
            { name: offer.title, path: `/erbjudanden/${offer.slug}` },
          ]),
        )}
      />
    </article>
  );
}
