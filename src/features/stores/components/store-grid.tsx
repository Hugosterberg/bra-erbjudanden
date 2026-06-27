import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StoreLogo } from "@/shared/ui/store-logo";

import type { Store as StoreType } from "../types";

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <Link key={store.id} href={`/butiker/${store.slug}`} className="group">
          <Card className="group relative h-full overflow-hidden rounded-2xl shadow-none ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-primary/20">
            <span aria-hidden className="deal-shine z-10" />
            <CardContent className="flex items-start gap-4 p-5">
              <StoreLogo
                name={store.name}
                logoUrl={store.logo_url}
                websiteUrl={store.website_url}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {store.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {store.description ?? "Aktuella erbjudanden och kampanjer."}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Visa erbjudanden
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
