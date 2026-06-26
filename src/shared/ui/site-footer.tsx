import Link from "next/link";

import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl space-y-3">
          <p className="font-semibold">braerbjudanden.se</p>
          <AffiliateDisclosure />
        </div>
        <nav className="grid gap-2 text-sm text-muted-foreground sm:grid-flow-col sm:gap-6">
          <Link href="/erbjudanden" className="hover:text-foreground">
            Erbjudanden
          </Link>
          <Link href="/butiker" className="hover:text-foreground">
            Butiker
          </Link>
          <Link href="/kategorier" className="hover:text-foreground">
            Kategorier
          </Link>
        </nav>
      </div>
    </footer>
  );
}
