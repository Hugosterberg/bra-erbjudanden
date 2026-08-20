// @ts-nocheck
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { registerAdvertiser } from "@/features/ad-network/actions";

const registerSchema = z.object({
  businessName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  country: z.string().max(2).default("SE"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const result = await registerAdvertiser(validated);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        advertiserId: result.advertiserId,
        message:
          "Din ansökan har skickats för granskning. Vi kontaktar dig snart med API-nycklar.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in advertiser registration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
