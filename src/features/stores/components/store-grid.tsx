import Link from "next/link";
import { ArrowRight, ExternalLink, Globe, Store } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StoreLogo } from "@/shared/ui/store-logo";

import { getWebsiteScreenshotUrl } from "../screenshot";
import type { Store as StoreType } from "../types";
import { StoreCover } from "./store-cover";

function normalizeHref(websiteUrl: string) {
  return websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
}

function formatWebsiteLabel(websiteUrl: string) {
  return websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function StoreGrid({ stores }: { stores: StoreType[] }) {
  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center ring-1 ring-foreground/5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Inga butiker just nu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nya butiker och varumärken dyker upp löpande.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {stores.map((store, index) => (
        <Card
          key={store.id}
          className="group relative h-full overflow-hidden rounded-2xl p-0 shadow-none ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-primary/20"
        >
          <span aria-hidden className="deal-shine z-10" />
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            <StoreCover
              name={store.name}
              screenshotUrl={getWebsiteScreenshotUrl(store.website_url)}
              logoUrl={store.logo_url}
              websiteUrl={store.website_url}
              priority={index < 2}
            />
          </div>
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center gap-3">
              <StoreLogo
                name={store.name}
                logoUrl={store.logo_url}
                websiteUrl={store.website_url}
                size="md"
              />
              <h2 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                <Link
                  href={`/butiker/${store.slug}`}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {store.name}
                </Link>
              </h2>
              {store.website_url ? (
                <a
                  href={normalizeHref(store.website_url)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="relative z-20 inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60 transition-colors hover:bg-primary/10 hover:text-primary hover:ring-primary/30"
                  title={formatWebsiteLabel(store.website_url)}
                >
                  <Globe className="size-3.5 shrink-0" />
                  <span className="truncate">{formatWebsiteLabel(store.website_url)}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {store.description ?? "Aktuella erbjudanden och kampanjer."}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
              Visa erbjudanden
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
