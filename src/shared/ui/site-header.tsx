import Link from "next/link";
import { BellRing, Menu, Search, ShieldCheck, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/shared/config/site";
import { MainNav } from "@/shared/ui/main-nav";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const navigation = [
  { href: "/erbjudanden", label: "Erbjudanden" },
  { href: "/rabattkoder", label: "Rabattkoder" },
  { href: "/kampanjer", label: "Kampanjer" },
  { href: "/butiker", label: "Butiker" },
  { href: "/kategorier", label: "Kategorier" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold">
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:-rotate-6">
            <Tag className="size-4.5" />
          </span>
          <span className="leading-tight">
            <span className="text-[15px] font-semibold tracking-tight">
              braerbjudanden
              <span className="text-muted-foreground">.se</span>
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              Handplockade deals
            </span>
          </span>
        </Link>

        <MainNav items={navigation} />

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/erbjudanden">
              <Search className="size-4" />
              Hitta deal
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/#bevakning">
              <BellRing className="size-4" />
              Bevaka
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Öppna meny">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>{siteConfig.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-8 grid gap-3 px-4">
              <div className="flex justify-end pb-1">
                <ThemeToggle />
              </div>
              {navigation.map((item) => (
                <Button key={item.href} variant="ghost" className="justify-start" asChild>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
              <Button className="mt-3 justify-start" asChild>
                <Link href="/erbjudanden">
                  <ShieldCheck className="size-4" />
                  Se utvalda erbjudanden
                </Link>
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
    </header>
  );
}
