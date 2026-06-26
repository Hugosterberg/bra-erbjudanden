import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { StoreForm } from "@/features/stores/components/store-form";
import { updateStoreAction } from "@/features/stores/actions";
import { findAdminStoreById } from "@/features/stores/queries";

type EditStorePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStorePage({ params }: EditStorePageProps) {
  await requireAdmin();
  const { id } = await params;
  const store = await findAdminStoreById(id);

  if (!store) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    const result = await updateStoreAction(id, formData);
    if (result.ok) {
      redirect("/admin/butiker");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Redigera butik</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreForm store={store} action={action} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
