import Link from "next/link";
import { Menu, Search, ShieldCheck } from "lucide-react";

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
  { href: "/butiker", label: "Butiker" },
  { href: "/kategorier", label: "Kategorier" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            be
          </span>
          <span>{siteConfig.name}</span>
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Admin</Link>
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
