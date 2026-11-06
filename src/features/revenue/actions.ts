"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";

import { syncNetworkTransactions } from "./sync";

export async function syncTransactionsAction(): Promise<void> {
  await requireAdmin();
  await syncNetworkTransactions();
  revalidatePath("/admin/intakter");
}
