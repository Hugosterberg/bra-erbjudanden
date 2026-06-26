import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

export type SubscriberStats = {
  activeCount: number;
};

export async function findSubscriberStats(): Promise<SubscriberStats> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { activeCount: 0 };
  }

  const { count } = await supabase
    .from("deal_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return { activeCount: count ?? 0 };
}
