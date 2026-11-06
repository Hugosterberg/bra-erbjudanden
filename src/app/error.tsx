"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <TriangleAlert className="size-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance">
          Något gick fel
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sidan kunde inte visas just nu. Försök igen om en liten stund.
        </p>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <Button type="button" onClick={reset}>
            Försök igen
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Till startsidan</Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground">Felkod: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
