import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { OfferForm } from "@/features/offers/components/offer-form";
import { findAdminStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Nytt erbjudande",
  description: "Skapa ett nytt erbjudande.",
  path: "/admin/erbjudanden/new",
});

export default async function NewOfferPage() {
  await requireAdmin();
  const [stores, categories] = await Promise.all([findAdminStores(), findAdminCategories()]);

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Nytt erbjudande</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm stores={stores} categories={categories} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
