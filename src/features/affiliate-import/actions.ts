"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";

import { runAffiliateImport } from "./sync";

export type ImportActionState = {
  ok: boolean;
  message: string;
};

export async function triggerAffiliateImportAction(): Promise<ImportActionState> {
  await requireAdmin();

  const result = await runAffiliateImport();

  revalidatePath("/admin");
  revalidatePath("/admin/import");

  return {
    ok: result.ok && !result.skipped,
    message: result.message,
  };
}
