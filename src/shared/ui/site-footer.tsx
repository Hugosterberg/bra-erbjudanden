import Link from "next/link";
import { BadgeCheck, BellRing, CheckCircle2, ShieldCheck, Tag } from "lucide-react";

import { DealSignupForm } from "@/features/subscribers/components/deal-signup-form";
import { siteConfig } from "@/shared/config/site";
import { AffiliateDisclosure } from "@/shared/ui/affiliate-disclosure";

const signupPerks = [
  { icon: BadgeCheck, label: "Handplockat urval" },
  { icon: ShieldCheck, label: "Ingen spam" },
  { icon: CheckCircle2, label: "Avsluta när du vill" },
];

const footerPerks = [
  { icon: BadgeCheck, label: "Handplockat urval" },
  { icon: CheckCircle2, label: "Bara aktiva erbjudanden" },
  { icon: ShieldCheck, label: "Annonslänkar märks tydligt" },
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
              uppmärksamhet. Inget brus, bara de bästa erbjudandena.
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
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <Link
              href="/"
              aria-label="braerbjudanden.se – till startsidan"
              className="group flex cursor-pointer items-center gap-2.5 font-semibold"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:-rotate-6">
                <Tag className="size-4.5" />
              </span>
              <span className="text-base tracking-tight">
                braerbjudanden<span className="text-muted-foreground">.se</span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {siteConfig.description} Vi rankar tydligt och visar bara aktiva
              deals – aldrig utgångna.
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              {footerPerks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <li
                    key={perk.label}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    {perk.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
          <AffiliateDisclosure />
          <div className="flex flex-col gap-1 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} braerbjudanden.se · Alla priser med
              reservation för ändringar.
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/erbjudanden" className="hover:text-foreground">
                Erbjudanden
              </Link>
              <Link href="/rabattkoder" className="hover:text-foreground">
                Rabattkoder
              </Link>
              <Link href="/bast-i-test" className="hover:text-foreground">
                Bäst i test
              </Link>
              <Link href="/butiker" className="hover:text-foreground">
                Butiker
              </Link>
              <Link href="/kategorier" className="hover:text-foreground">
                Kategorier
              </Link>
              <Link href="/guider" className="hover:text-foreground">
                Guider
              </Link>
              <Link href="/partner" className="hover:text-foreground">
                Partner
              </Link>
              <Link href="/affiliatedisclosure" className="hover:text-foreground">
                Annonsinformation
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
