import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { createProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Ny produkt",
  description: "Lägg till en produkt för recensioner.",
  path: "/admin/produkter/new",
  index: false,
});

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await findAdminCategories();

  async function action(formData: FormData) {
    "use server";
    const result = await createProductAction(formData);
    if (result.ok) {
      redirect("/admin/produkter");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Ny produkt</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm action={action} categories={categories} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
