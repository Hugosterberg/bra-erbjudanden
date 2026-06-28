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

export async function deleteSubscriberAction(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    await supabase.from("deal_subscribers").delete().eq("id", id);
  }

  revalidatePath("/admin/prenumeranter");
  revalidatePath("/admin");
}
