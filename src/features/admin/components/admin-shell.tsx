import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, LogOut, Store, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/features/admin/auth";

const adminNavigation = [
  { href: "/admin", label: "Översikt", icon: LayoutDashboard },
  { href: "/admin/erbjudanden", label: "Erbjudanden", icon: Tags },
  { href: "/admin/butiker", label: "Butiker", icon: Store },
  { href: "/admin/kategorier", label: "Kategorier", icon: Tags },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="font-semibold">
            braerbjudanden.se admin
          </Link>
          <form action={signOutAction}>
            <Button variant="ghost" size="sm">
              <LogOut className="size-4" />
              Logga ut
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border bg-background p-2">
          <nav className="grid gap-1">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.href} variant="ghost" className="justify-start" asChild>
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/">Visa webbplats</Link>
          </Button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
