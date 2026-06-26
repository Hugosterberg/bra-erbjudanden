import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createCategoryAction } from "@/features/categories/actions";
import { CategoryForm } from "@/features/categories/components/category-form";

export default async function NewCategoryPage() {
  await requireAdmin();

  async function action(formData: FormData) {
    "use server";
    const result = await createCategoryAction(formData);
    if (result.ok) {
      redirect("/admin/kategorier");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Ny kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm action={action} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
