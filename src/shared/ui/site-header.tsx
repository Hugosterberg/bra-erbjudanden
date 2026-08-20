import Link from "next/link";
import { BellRing, Menu, Search, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteSearchForm } from "@/features/search/components/site-search-form";
import { siteConfig } from "@/shared/config/site";
import { MainNav } from "@/shared/ui/main-nav";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const navigation = [
  { href: "/erbjudanden", label: "Erbjudanden" },
  { href: "/rabattkoder", label: "Rabattkoder" },
  { href: "/bast-i-test", label: "Bäst i test" },
  { href: "/butiker", label: "Butiker" },
  { href: "/kategorier", label: "Kategorier" },
  { href: "/guider", label: "Guider" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="braerbjudanden.se – till startsidan"
          className="group flex cursor-pointer items-center gap-2.5 font-semibold"
        >
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:-rotate-6">
            <Tag className="size-4.5" />
          </span>
          <span className="leading-tight">
            <span className="text-[15px] font-semibold tracking-tight">
              braerbjudanden
              <span className="text-muted-foreground">.se</span>
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              Hitta ett bra köp
            </span>
          </span>
        </Link>

        <MainNav items={navigation} />

        <div className="hidden items-center gap-1 xl:flex">
          <div className="w-56">
            <SiteSearchForm size="compact" />
          </div>
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href="/#bevakning">
              <BellRing className="size-4" />
              Bevaka
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/sok" aria-label="Sök">
              <Search className="size-5" />
            </Link>
          </Button>
          {/* Between lg and xl the nav is visible but the wide action group is
              not, so the deal-alert CTA falls back to an icon button. */}
          <Button variant="ghost" size="icon" asChild className="hidden lg:inline-flex">
            <Link href="/#bevakning" aria-label="Bevaka erbjudanden">
              <BellRing className="size-5" />
            </Link>
          </Button>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Öppna meny">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>{siteConfig.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 grid gap-3 px-4">
                <SiteSearchForm size="compact" />
                {navigation.map((item) => (
                  <Button key={item.href} variant="ghost" className="justify-start" asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                <Button className="mt-3 justify-start" asChild>
                  <Link href="/erbjudanden">Se aktuella erbjudanden</Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/#bevakning">
                    <BellRing className="size-4" />
                    Få erbjudanden först
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
