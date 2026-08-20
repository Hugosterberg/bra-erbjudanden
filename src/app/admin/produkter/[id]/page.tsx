import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { updateProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { findAdminProductById } from "@/features/products/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Redigera produkt",
  description: "Uppdatera produktuppgifter.",
  path: "/admin/produkter",
  index: false,
});

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    findAdminProductById(id),
    findAdminCategories(),
  ]);

  if (!product) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    const result = await updateProductAction(id, formData);
    if (result.ok) {
      redirect("/admin/produkter");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Redigera produkt</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} action={action} categories={categories} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
