import Link from "next/link";
import { ArrowRight, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Category } from "../types";

type CategoryWithCount = Category & {
  offerCount: number;
};

type CategoryStripProps = {
  categories: CategoryWithCount[];
};

export function CategoryStrip({ categories }: CategoryStripProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border/70 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Kategorier</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Hitta rätt typ av deal
            </h2>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/kategorier">
              Alla kategorier
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/kategorier/${category.slug}`}
              className="group relative flex shrink-0 items-center gap-2.5 overflow-hidden rounded-xl bg-card px-4 py-3 shadow-soft ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:ring-primary/25 sm:shrink"
            >
              <span aria-hidden className="deal-shine z-10" />
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Tags className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight">{category.name}</span>
                <span className="text-xs text-muted-foreground" data-numeric>
                  {category.offerCount} {category.offerCount === 1 ? "erbjudande" : "erbjudanden"}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <Button variant="ghost" size="sm" asChild className="mt-4 w-full sm:hidden">
          <Link href="/kategorier">
            Alla kategorier
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
