"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";

import { runAffiliateImport } from "./sync";
import type { AffiliateNetwork } from "./types";

export type ImportActionState = {
  ok: boolean;
  warning?: boolean;
  message: string;
  errors?: string[];
};

function revalidateImportPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/import");
  revalidatePath("/admin/erbjudanden");
}

function toActionState(result: Awaited<ReturnType<typeof runAffiliateImport>>): ImportActionState {
  return {
    ok: result.ok && !result.skipped,
    warning: result.warning,
    message: result.message,
    errors: result.errors.length > 0 ? result.errors : undefined,
  };
}

export async function triggerAffiliateImportAction(): Promise<ImportActionState> {
  await requireAdmin();

  const result = await runAffiliateImport({ source: "manual" });
  revalidateImportPages();

  return toActionState(result);
}

export async function triggerNetworkImportAction(
  network: AffiliateNetwork,
): Promise<ImportActionState> {
  await requireAdmin();

  const result = await runAffiliateImport({
    source: "manual",
    networks: [network],
  });

  revalidateImportPages();

  return toActionState(result);
}
