import { createHash } from "node:crypto";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

export function rateLimitKeyFromHeaders(scope: string, headers: Pick<Headers, "get">) {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown";
  const salt = process.env.CLICK_HASH_SALT ?? "local-development";

  return `${scope}:${createHash("sha256").update(`${salt}:limit:${ip}`).digest("hex")}`;
}

/**
 * Counts in Postgres because serverless instances share no memory. Fails open:
 * a database hiccup must not lock people out, and the callers have other guards.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return true;
  }

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] Check failed", error.message);
    return true;
  }

  return data !== false;
}
