import Link from "next/link";
import { BadgeCheck, BellRing, ShieldCheck } from "lucide-react";

import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="max-w-xl space-y-3">
            <p className="font-semibold">braerbjudanden.se</p>
            <AffiliateDisclosure />
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Tydlig annonsmärkning
            </p>
            <p className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" />
              Redaktionellt urval
            </p>
            <p className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              Relevanta tips
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/erbjudanden" className="hover:text-foreground">
              Erbjudanden
            </Link>
            <Link href="/rabattkoder" className="hover:text-foreground">
              Rabattkoder
            </Link>
            <Link href="/kampanjer" className="hover:text-foreground">
              Kampanjer
            </Link>
            <Link href="/butiker" className="hover:text-foreground">
              Butiker
            </Link>
            <Link href="/kategorier" className="hover:text-foreground">
              Kategorier
            </Link>
          </nav>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Få de bästa erbjudandena</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ett kort urval när något nytt är värt att känna till.
          </p>
          <div className="mt-4">
            <DealSignupForm source="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
