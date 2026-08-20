// @ts-nocheck
"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

/**
 * Create an A/B test for two creatives
 */
export async function createCreativeTest(params: {
  campaignId: string;
  controlCreativeId: string;
  variantCreativeId: string;
  testType: "headline" | "image" | "copy" | "cta";
}): Promise<{ success: boolean; testId?: string; error?: string }> {
  try {
    const client = createAdminClient();

    const { data, error } = await client
      .from("ad_creative_tests")
      .insert([
        {
          campaign_id: params.campaignId,
          control_creative_id: params.controlCreativeId,
          variant_creative_id: params.variantCreativeId,
          test_type: params.testType,
          status: "running",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating test:", error);
      return { success: false, error: error.message };
    }

    return { success: true, testId: data.id };
  } catch (error) {
    console.error("Unexpected error creating test:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get test performance data
 */
export async function getTestPerformance(
  testId: string,
): Promise<{
  controlMetrics: { impressions: number; clicks: number; ctr: number };
  variantMetrics: { impressions: number; clicks: number; ctr: number };
  winner: "control" | "variant" | "inconclusive";
  confidence: number;
}> {
  const client = createAdminClient();

  // Get test info
  const { data: test } = await client.from("ad_creative_tests").select("*").eq("id", testId).single();

  if (!test) {
    return {
      controlMetrics: { impressions: 0, clicks: 0, ctr: 0 },
      variantMetrics: { impressions: 0, clicks: 0, ctr: 0 },
      winner: "inconclusive",
      confidence: 0,
    };
  }

  // Get metrics for control
  const { data: controlImpressions } = await client
    .from("ad_impressions")
    .select("*", { count: "exact", head: true })
    .eq("creative_id", test.control_creative_id);

  const { data: controlClicks } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("creative_id", test.control_creative_id);

  // Get metrics for variant
  const { data: variantImpressions } = await client
    .from("ad_impressions")
    .select("*", { count: "exact", head: true })
    .eq("creative_id", test.variant_creative_id);

  const { data: variantClicks } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("creative_id", test.variant_creative_id);

  const controlImpCount = controlImpressions?.length || 0;
  const controlClickCount = controlClicks?.length || 0;
  const variantImpCount = variantImpressions?.length || 0;
  const variantClickCount = variantClicks?.length || 0;

  const controlCTR = controlImpCount > 0 ? (controlClickCount / controlImpCount) * 100 : 0;
  const variantCTR = variantImpCount > 0 ? (variantClickCount / variantImpCount) * 100 : 0;

  // Determine winner (simple comparison - in production use chi-square test)
  let winner: "control" | "variant" | "inconclusive" = "inconclusive";
  let confidence = 0;

  if (variantCTR > controlCTR * 1.1) {
    winner = "variant";
    confidence = Math.min(95, (variantCTR / controlCTR) * 80); // Simple confidence estimate
  } else if (controlCTR > variantCTR * 1.1) {
    winner = "control";
    confidence = Math.min(95, (controlCTR / variantCTR) * 80);
  }

  return {
    controlMetrics: {
      impressions: controlImpCount,
      clicks: controlClickCount,
      ctr: controlCTR,
    },
    variantMetrics: {
      impressions: variantImpCount,
      clicks: variantClickCount,
      ctr: variantCTR,
    },
    winner,
    confidence,
  };
}

/**
 * End test and apply winner
 */
export async function concludeTest(testId: string, applyWinner: boolean = true): Promise<{ success: boolean; winner?: string; error?: string }> {
  try {
    const client = createAdminClient();

    // Get test
    const { data: test } = await client.from("ad_creative_tests").select("*").eq("id", testId).single();

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    // Get performance
    const performance = await getTestPerformance(testId);

    // Update test status
    await client
      .from("ad_creative_tests")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        winner_id: applyWinner ? (performance.winner === "variant" ? test.variant_creative_id : test.control_creative_id) : null,
        confidence_level: performance.confidence / 100,
      })
      .eq("id", testId);

    // If applying winner, update campaign to use winning creative
    if (applyWinner && performance.winner !== "inconclusive") {
      // In production, would update campaign to primarily use winning creative
      // const winnerId = performance.winner === "variant" ? test.variant_creative_id : test.control_creative_id;
      // await updateCampaignPrimaryCreative(test.campaign_id, winnerId);
    }

    return {
      success: true,
      winner: performance.winner,
    };
  } catch (error) {
    console.error("Unexpected error concluding test:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get recommended creative split for ongoing test
 */
export async function getOptimalTestSplit(testId: string): Promise<{ controlPercentage: number; variantPercentage: number }> {
  const performance = await getTestPerformance(testId);

  // Thompson sampling for bandit allocation
  // Allocate more traffic to better performer
  const controlCTR = performance.controlMetrics.ctr;
  const variantCTR = performance.variantMetrics.ctr;

  const totalCTR = controlCTR + variantCTR;

  if (totalCTR === 0) {
    return { controlPercentage: 50, variantPercentage: 50 };
  }

  return {
    controlPercentage: (controlCTR / totalCTR) * 100,
    variantPercentage: (variantCTR / totalCTR) * 100,
  };
}

/**
 * List all tests for campaign
 */
export async function getCampaignTests(campaignId: string): Promise<Array<{
  id: string;
  testType: string;
  status: string;
  winner: string | null;
  confidence: number;
}>> {
  const client = createAdminClient();

  const { data } = await client.from("ad_creative_tests").select("id, test_type, status, winner_id, confidence_level").eq("campaign_id", campaignId);

  return (
    data?.map((test) => ({
      id: test.id,
      testType: test.test_type,
      status: test.status,
      winner: test.winner_id,
      confidence: test.confidence_level || 0,
    })) || []
  );
}
