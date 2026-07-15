import Link from "next/link";
import { ArrowRight, BarChart3, Download, MailCheck, MousePointerClick, Store, Tags, TicketPercent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findLatestImportRun } from "@/features/affiliate-import/queries";
import { findAdminCategories } from "@/features/categories/queries";
import { findAdminOffers } from "@/features/offers/queries";
import { findAdminStores } from "@/features/stores/queries";
import { findSubscriberStats } from "@/features/subscribers/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Admin",
  description: "Adminöversikt för erbjudanden, butiker och klickstatistik.",
  path: "/admin",
});

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [offers, stores, categories, subscriberStats, latestImport] = await Promise.all([
    findAdminOffers(),
    findAdminStores(),
    findAdminCategories(),
    findSubscriberStats(),
    findLatestImportRun(),
  ]);
  const importedOffers = offers.filter((offer) => offer.is_imported).length;
  const websiteClicks = offers.reduce(
    (sum, offer) => sum + (offer.website_click_count ?? 0),
    0,
  );
  const codeClicks = offers.reduce(
    (sum, offer) => sum + (offer.code_click_count ?? 0),
    0,
  );

  const stats = [
    { label: "Erbjudanden", value: offers.length, icon: Tags },
    { label: "Importerade", value: importedOffers, icon: Download },
    { label: "Butiker", value: stores.length, icon: Store },
    { label: "Kategorier", value: categories.length, icon: BarChart3 },
    { label: "Klick hemsida", value: websiteClicks, icon: MousePointerClick },
    { label: "Klick rabattkod", value: codeClicks, icon: TicketPercent },
    { label: "Prenumeranter", value: subscriberStats.activeCount, icon: MailCheck },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Översikt</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enkel status för innehåll, ranking och klickmätning.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="rounded-lg shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {latestImport ? (
          <Card className="rounded-lg shadow-none">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Senaste affiliate-import</p>
                <p className="text-sm text-muted-foreground">
                  {latestImport.status} ·{" "}
                  {new Intl.DateTimeFormat("sv-SE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(latestImport.started_at))}
                  {latestImport.stats
                    ? ` · ${latestImport.stats.totals.created} nya, ${latestImport.stats.totals.updated} uppdaterade`
                    : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/import">
                  Visa import
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}
