import { createClient } from "@supabase/supabase-js";

import { getServiceSupabaseConfig } from "@/shared/lib/env";
import type { Database } from "@/shared/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  const config = getServiceSupabaseConfig();

  if (!config) {
    return null;
  }

  adminClient ??= createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
