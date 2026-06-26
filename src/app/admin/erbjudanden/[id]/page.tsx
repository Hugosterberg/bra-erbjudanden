import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { OfferForm } from "@/features/offers/components/offer-form";
import { findAdminOfferById } from "@/features/offers/queries";
import { findAdminStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

type EditOfferPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = createMetadata({
  title: "Redigera erbjudande",
  description: "Redigera ett erbjudande.",
});

export default async function EditOfferPage({ params }: EditOfferPageProps) {
  await requireAdmin();
  const { id } = await params;
  const [offer, stores, categories] = await Promise.all([
    findAdminOfferById(id),
    findAdminStores(),
    findAdminCategories(),
  ]);

  if (!offer) {
    notFound();
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Redigera erbjudande</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm offer={offer} stores={stores} categories={categories} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
