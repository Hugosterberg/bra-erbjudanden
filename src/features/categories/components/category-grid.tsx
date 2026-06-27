import Link from "next/link";
import { ArrowRight, Tags } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { Category } from "../types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center ring-1 ring-foreground/5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Tags className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Inga kategorier just nu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kategorier visas här när det finns erbjudanden att gruppera.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.id} href={`/kategorier/${category.slug}`} className="group">
          <Card className="group relative h-full overflow-hidden rounded-2xl shadow-none ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-primary/20">
            <span aria-hidden className="deal-shine z-10" />
            <CardContent className="flex items-start gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Tags className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {category.description ?? "Samlad överblick över relevanta rabatter."}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Utforska kategori
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
