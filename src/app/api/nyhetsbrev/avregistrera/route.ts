import { NextResponse, type NextRequest } from "next/server";

import { unsubscribeByToken } from "@/features/subscribers/subscribe";

/** One-click unsubscribe (RFC 8058): mail clients POST here without a page. */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  await unsubscribeByToken(token);

  return new NextResponse(null, { status: 200 });
}
