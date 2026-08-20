import Link from "next/link";
import { ArrowRight, SearchX, Store, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/shared/lib/seo";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";

export const metadata = createMetadata({
  title: "Sidan finns inte",
  description: "Sidan du letade efter finns inte längre. Hitta aktuella erbjudanden, rabattkoder och kampanjer istället.",
});

const quickLinks = [
  { href: "/erbjudanden", label: "Alla erbjudanden", icon: Tags },
  { href: "/butiker", label: "Butiker", icon: Store },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SearchX className="size-7" />
          </div>
          <p className="mt-6 text-sm font-medium text-primary" data-numeric>
            404
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            Sidan finns inte
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sidan du letade efter kan ha flyttats. Utgångna erbjudanden ligger
            kvar med alternativa deals – annars finns aktuella rabatter på
            startsidan.
          </p>
          <div className="mt-8 grid gap-2">
            <Button asChild size="lg" className="h-11">
              <Link href="/">
                Till startsidan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button key={link.href} asChild variant="outline">
                    <Link href={link.href}>
                      <Icon className="size-4" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
