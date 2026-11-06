import { NextResponse } from "next/server";

import { getCronSecret } from "@/features/affiliate-import/config";
import { syncNetworkTransactions } from "@/features/revenue/sync";

export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = getCronSecret();
  const authorized = cronSecret
    ? request.headers.get("authorization") === `Bearer ${cronSecret}`
    : process.env.NODE_ENV !== "production";

  if (!authorized) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await syncNetworkTransactions();

  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}
