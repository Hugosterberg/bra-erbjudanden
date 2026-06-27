import { NextResponse } from "next/server";

import { registerDealSubscriber } from "@/features/subscribers/subscribe";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await registerDealSubscriber(formData);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
