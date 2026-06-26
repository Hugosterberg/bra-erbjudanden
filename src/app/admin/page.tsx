import { BarChart3, MousePointerClick, Store, Tags } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { findAdminOffers } from "@/features/offers/queries";
import { findAdminStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Admin",
  description: "Adminöversikt för erbjudanden, butiker och klickstatistik.",
  path: "/admin",
});

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [offers, stores, categories] = await Promise.all([
    findAdminOffers(),
    findAdminStores(),
    findAdminCategories(),
  ]);
  const clicks = offers.reduce((sum, offer) => sum + (offer.click_count ?? 0), 0);

  const stats = [
    { label: "Erbjudanden", value: offers.length, icon: Tags },
    { label: "Butiker", value: stores.length, icon: Store },
    { label: "Kategorier", value: categories.length, icon: BarChart3 },
    { label: "Klick", value: clicks, icon: MousePointerClick },
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </div>
    </AdminShell>
  );
}
