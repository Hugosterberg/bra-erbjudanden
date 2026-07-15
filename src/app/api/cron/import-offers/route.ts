import { NextResponse } from "next/server";

import { getCronSecret } from "@/features/affiliate-import/config";
import { runAffiliateImport } from "@/features/affiliate-import/sync";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function handleImport(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await runAffiliateImport({ source: "cron" });

  if (result.skipped) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}

export async function GET(request: Request) {
  return handleImport(request);
}

export async function POST(request: Request) {
  return handleImport(request);
}
