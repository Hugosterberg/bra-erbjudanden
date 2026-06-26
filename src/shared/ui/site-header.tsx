import Link from "next/link";
import { BellRing, Menu, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/shared/config/site";

const navigation = [
  { href: "/erbjudanden", label: "Erbjudanden" },
  { href: "/rabattkoder", label: "Rabattkoder" },
  { href: "/kampanjer", label: "Kampanjer" },
  { href: "/butiker", label: "Butiker" },
  { href: "/kategorier", label: "Kategorier" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground shadow-sm">
            be
          </span>
          <span className="leading-tight">
            {siteConfig.name}
            <span className="block text-xs font-normal text-muted-foreground">
              Handplockade deals
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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
