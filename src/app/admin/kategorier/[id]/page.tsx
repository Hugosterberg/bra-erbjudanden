import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { updateCategoryAction } from "@/features/categories/actions";
import { CategoryForm } from "@/features/categories/components/category-form";
import { findAdminCategoryById } from "@/features/categories/queries";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requireAdmin();
  const { id } = await params;
  const category = await findAdminCategoryById(id);

  if (!category) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    const result = await updateCategoryAction(id, formData);
    if (result.ok) {
      redirect("/admin/kategorier");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Redigera kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm category={category} action={action} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
