import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Tables } from "@/shared/types/database";

export type NewsletterSubscriber = Tables<"deal_subscribers">;

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

export async function findAdminSubscribers(limit = 200): Promise<NewsletterSubscriber[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("deal_subscribers")
    .select("*")
    .order("last_signup_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as NewsletterSubscriber[];
}
