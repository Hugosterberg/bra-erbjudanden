import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { findAdminCategories } from "@/features/categories/queries";
import { updateArticleAction } from "@/features/editorial/actions";
import { ArticleForm } from "@/features/editorial/components/article-form";
import { findAdminArticleById } from "@/features/editorial/queries";
import { findAdminProducts } from "@/features/products/queries";
import { findAdminStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Redigera artikel",
  description: "Uppdatera redaktionellt innehåll.",
  path: "/admin/artiklar",
  index: false,
});

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  await requireAdmin();
  const { id } = await params;
  const [article, categories, stores, products] = await Promise.all([
    findAdminArticleById(id),
    findAdminCategories(),
    findAdminStores(),
    findAdminProducts(),
  ]);

  if (!article) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    const result = await updateArticleAction(id, formData);
    if (result.ok) {
      redirect("/admin/artiklar");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Redigera artikel</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            article={article}
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
