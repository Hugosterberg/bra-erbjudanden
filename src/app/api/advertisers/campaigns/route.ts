// @ts-nocheck
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createAdCampaign } from "@/features/ad-network/actions";

const createCampaignSchema = z.object({
  apiKey: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  targetUrl: z.string().url(),
  campaignType: z.enum(["banner", "featured_offer", "native", "sidebar"]),
  pricingModel: z.enum(["cpm", "cpc", "daily_flat"]),
  bidAmount: z.number().positive(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  dailyBudget: z.number().optional(),
  totalBudget: z.number().optional(),
  targetCategories: z.array(z.string()).optional(),
  targetRegions: z.array(z.string()).optional(),
});

async function verifyApiKey(apiKey: string): Promise<string | null> {
  const client = createAdminClient();

  const { data, error } = await client
    .from("advertiser_accounts")
    .select("id, status")
    .eq("api_key", apiKey)
    .eq("status", "approved")
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    // Verify API key and get advertiser ID
    const advertiserId = await verifyApiKey(validated.apiKey);
    if (!advertiserId) {
      return NextResponse.json({ error: "Invalid or unapproved API key" }, { status: 401 });
    }

    // Verify dates
    const starts = new Date(validated.startsAt);
    const ends = new Date(validated.endsAt);
    if (starts >= ends) {
      return NextResponse.json(
        { error: "Campaign end date must be after start date" },
        { status: 400 },
      );
    }

    const result = await createAdCampaign(advertiserId, {
      name: validated.name,
      description: validated.description,
      targetUrl: validated.targetUrl,
      campaignType: validated.campaignType,
      pricingModel: validated.pricingModel,
      bidAmount: validated.bidAmount,
      startsAt: validated.startsAt,
      endsAt: validated.endsAt,
      dailyBudget: validated.dailyBudget,
      totalBudget: validated.totalBudget,
      targetCategories: validated.targetCategories,
      targetRegions: validated.targetRegions,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        campaignId: result.campaignId,
        status: "pending_approval",
        message:
          "Kampanjen har skapats och väntar på godkännande. Du får ett mail när den är godkänd.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating campaign:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
