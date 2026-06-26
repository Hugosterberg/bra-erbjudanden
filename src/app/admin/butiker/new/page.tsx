import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createStoreAction } from "@/features/stores/actions";
import { StoreForm } from "@/features/stores/components/store-form";

export default async function NewStorePage() {
  await requireAdmin();

  async function action(formData: FormData) {
    "use server";
    const result = await createStoreAction(formData);
    if (result.ok) {
      redirect("/admin/butiker");
    }
  }

  return (
    <AdminShell>
      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Ny butik</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreForm action={action} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
