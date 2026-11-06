import { NextResponse } from "next/server";

import { getCronSecret } from "@/features/affiliate-import/config";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

// The periods are stated on /integritetspolicy. Change both together.
const IDENTIFIER_RETENTION_DAYS = 90;
const EVENT_RETENTION_DAYS = 395;

export async function GET(request: Request) {
  const cronSecret = getCronSecret();
  const authorized = cronSecret
    ? request.headers.get("authorization") === `Bearer ${cronSecret}`
    : process.env.NODE_ENV !== "production";

  if (!authorized) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("purge_tracking_data", {
    p_identifier_days: IDENTIFIER_RETENTION_DAYS,
    p_event_days: EVENT_RETENTION_DAYS,
  });

  if (error) {
    console.error("[tracking] Purge failed", error.message);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data?.[0] ?? null });
}
