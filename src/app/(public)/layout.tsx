import type { ReactNode } from "react";

import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#innehall"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Hoppa till innehållet
      </a>
      <SiteHeader />
      <main id="innehall" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
