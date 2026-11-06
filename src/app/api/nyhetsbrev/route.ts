import { NextResponse } from "next/server";

import { registerDealSubscriber } from "@/features/subscribers/subscribe";
import { consumeRateLimit, rateLimitKeyFromHeaders } from "@/shared/lib/rate-limit";

export async function POST(request: Request) {
  const key = rateLimitKeyFromHeaders("newsletter-signup", request.headers);
  if (!(await consumeRateLimit(key, 5, 60 * 60))) {
    return NextResponse.json(
      { ok: false, message: "För många försök. Försök igen om en stund." },
      { status: 429 },
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, message: "Ogiltig förfrågan." }, { status: 400 });
  }

  const result = await registerDealSubscriber(formData);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
