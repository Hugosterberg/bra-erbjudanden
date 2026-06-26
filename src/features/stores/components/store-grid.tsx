import Link from "next/link";
import { Store } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { Store as StoreType } from "../types";

export function StoreGrid({ stores }: { stores: StoreType[] }) {
  if (stores.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <h2 className="text-lg font-semibold">Inga butiker ännu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lägg till butiker i adminpanelen för att visa dem publikt.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <Link key={store.id} href={`/butiker/${store.slug}`}>
          <Card className="h-full rounded-lg shadow-none transition hover:border-foreground/20">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                <Store className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">{store.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {store.description ?? "Aktuella erbjudanden och kampanjer."}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
