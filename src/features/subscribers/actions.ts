"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { initialSubscriberState, registerDealSubscriber, type SubscriberResult } from "./subscribe";

export { initialSubscriberState };

export async function subscribeToDealsAction(
  _state: SubscriberResult,
  formData: FormData,
): Promise<SubscriberResult> {
  return registerDealSubscriber(formData);
}

export type DeleteSubscriberResult = {
  ok: boolean;
  message?: string;
};

export async function deleteSubscriberAction(id: string): Promise<DeleteSubscriberResult> {
  await requireAdmin();

  if (!id) {
    return { ok: false, message: "Ingen prenumerant angiven." };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, message: "Databasen är inte konfigurerad." };
  }

  const { error } = await supabase.from("deal_subscribers").delete().eq("id", id);

  if (error) {
    console.error("[admin] Subscriber delete failed", error);
    return { ok: false, message: "Kunde inte ta bort prenumeranten." };
  }

  revalidatePath("/admin/prenumeranter");
  revalidatePath("/admin");

  return { ok: true };
}
