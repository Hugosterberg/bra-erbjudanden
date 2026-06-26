import Link from "next/link";
import { Tags } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { Category } from "../types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <h2 className="text-lg font-semibold">Inga kategorier ännu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kategorier visas här när de har skapats i adminpanelen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.id} href={`/kategorier/${category.slug}`}>
          <Card className="h-full rounded-lg shadow-none transition hover:border-foreground/20">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                <Tags className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {category.description ?? "Samlad överblick över relevanta rabatter."}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
