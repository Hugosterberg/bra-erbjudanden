import Link from "next/link";
import { BadgeCheck, BellRing, CheckCircle2, ShieldCheck, Tag } from "lucide-react";

import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

const signupPerks = [
  { icon: BadgeCheck, label: "Handplockat urval" },
  { icon: ShieldCheck, label: "Ingen spam" },
  { icon: CheckCircle2, label: "Avsluta när du vill" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-muted/35">
      <section
        id="bevakning"
        className="scroll-mt-header mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="bevaka-card relative overflow-hidden rounded-3xl bg-card p-8 shadow-soft ring-1 ring-foreground/10 sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <BellRing className="size-3.5" />
              Bevaka nya deals
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Missa aldrig en{" "}
              <span className="text-gradient-primary animate-gradient-pan">riktigt bra</span>{" "}
              rabatt
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Vi mailar ett kort, handplockat urval när något verkligen är värt din
              uppmärksamhet. Inget brus – bara de bästa erbjudandena.
            </p>

            <div className="mx-auto mt-7 max-w-md text-left">
              <DealSignupForm source="footer" />
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {signupPerks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <li
                    key={perk.label}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    {perk.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <div className="border-t border-border/70">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="max-w-xl space-y-3">
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/75 text-primary-foreground ring-1 ring-primary/20">
                <Tag className="size-4" />
              </span>
              braerbjudanden.se
            </Link>
            <AffiliateDisclosure />
          </div>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground sm:grid-cols-3 lg:justify-items-end">
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
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} braerbjudanden.se · Alla priser med reservation för ändringar.</p>
          <p>Byggt i Sverige · Endast aktiva erbjudanden</p>
        </div>
      </div>
    </footer>
  );
}
