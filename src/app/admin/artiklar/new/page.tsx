import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { createArticleAction } from "@/features/editorial/actions";
import { ArticleForm } from "@/features/editorial/components/article-form";
import { findAdminProducts } from "@/features/products/queries";
import { findAdminStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Ny artikel",
  description: "Skapa Bäst i test, recension eller guide.",
  path: "/admin/artiklar/new",
  index: false,
});

export default async function NewArticlePage() {
  await requireAdmin();
  const [categories, stores, products] = await Promise.all([
    findAdminCategories(),
    findAdminStores(),
    findAdminProducts(),
  ]);

  async function action(formData: FormData) {
    "use server";
    const result = await createArticleAction(formData);
    if (result.ok) {
      redirect("/admin/artiklar");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Ny artikel</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            action={action}
            categories={categories}
            stores={stores}
            products={products}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
