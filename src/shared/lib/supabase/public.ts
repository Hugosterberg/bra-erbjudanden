import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "@/shared/lib/env";
import type { Database } from "@/shared/types/database";

let publicClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabasePublicClient() {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return null;
  }

  publicClient ??= createClient<Database>(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicClient;
}
