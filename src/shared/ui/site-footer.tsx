import Link from "next/link";
import { BadgeCheck, BellRing, ShieldCheck } from "lucide-react";

import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
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
        <div className="space-y-3 lg:pt-1">
          <div>
            <h2 className="text-sm font-semibold">Få bra deals</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Kort urval när något är värt att veta.
            </p>
          </div>
          <DealSignupForm source="footer" variant="compact" />
        </div>
      </div>
    </footer>
  );
}
