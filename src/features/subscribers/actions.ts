"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  if (!id) {
    redirect("/admin/prenumeranter");
  }

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { error } = await supabase.from("deal_subscribers").delete().eq("id", id);

    if (error) {
      console.error("[admin] Subscriber delete failed", error);
    }
  }

  revalidatePath("/admin/prenumeranter");
  revalidatePath("/admin");
  redirect("/admin/prenumeranter");
}
