"use server";

import crypto from "crypto";
import { createAdminClient } from "@/shared/lib/supabase/admin";

export type WebhookEventType =
  | "campaign.created"
  | "campaign.approved"
  | "impression"
  | "click"
  | "conversion"
  | "budget_warning"
  | "campaign.paused";

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
  webhookId?: string;
}

/**
 * Register a webhook for an advertiser
 */
export async function registerWebhook(
  advertiserId: string,
  eventType: WebhookEventType,
  webhookUrl: string,
): Promise<{ success: boolean; signingSecret?: string; error?: string }> {
  try {
    const client = createAdminClient();
    const signingSecret = crypto.randomBytes(32).toString("hex");

    const { error } = await client.from("advertiser_webhooks").insert([
      {
        advertiser_id: advertiserId,
        event_type: eventType,
        webhook_url: webhookUrl,
        signing_secret: signingSecret,
      },
    ]);

    if (error) {
      console.error("Error registering webhook:", error);
      return { success: false, error: error.message };
    }

    return { success: true, signingSecret };
  } catch (error) {
    console.error("Unexpected error registering webhook:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send webhook event to advertiser
 */
export async function sendWebhookEvent(
  advertiserId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    // Get active webhooks for this event type
    const { data: webhooks, error: webhookError } = await client
      .from("advertiser_webhooks")
      .select("*")
      .eq("advertiser_id", advertiserId)
      .eq("event_type", eventType)
      .eq("active", true);

    if (webhookError || !webhooks) {
      console.error("Error fetching webhooks:", webhookError);
      return { success: false, error: webhookError?.message };
    }

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to each webhook
    const results = await Promise.all(
      webhooks.map((webhook) => deliverWebhook(webhook, payload, client)),
    );

    const allSuccess = results.every((r) => r.success);

    return { success: allSuccess };
  } catch (error) {
    console.error("Unexpected error sending webhook:", error);
    return { success: false, error: String(error) };
  }
}

interface Webhook {
  id: string;
  webhook_url: string;
  signing_secret: string;
}

async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  client: ReturnType<typeof createAdminClient>,
): Promise<{ success: boolean }> {
  const signature = createWebhookSignature(payload, webhook.signing_secret);

  try {
    const response = await fetch(webhook.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-ID": webhook.id,
      },
      body: JSON.stringify(payload),
      timeout: 10000,
    });

    const success = response.ok;

    // Log delivery attempt
    await client.from("webhook_delivery_log").insert([
      {
        webhook_id: webhook.id,
        event_type: payload.event,
        payload: payload,
        http_status: response.status,
        response_body: await response.text(),
        delivered_at: success ? new Date().toISOString() : null,
        failed_at: !success ? new Date().toISOString() : null,
      },
    ]);

    if (!success) {
      // Increment failure count and schedule retry
      const newFailureCount = (webhook.failure_count || 0) + 1;
      const shouldDisable = newFailureCount > 5;

      await client
        .from("advertiser_webhooks")
        .update({
          failure_count: newFailureCount,
          active: !shouldDisable,
        })
        .eq("id", webhook.id);
    } else {
      // Reset failure count on success
      await client
        .from("advertiser_webhooks")
        .update({
          failure_count: 0,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);
    }

    return { success };
  } catch (error) {
    console.error("Error delivering webhook:", error);

    // Log failed attempt
    await client.from("webhook_delivery_log").insert([
      {
        webhook_id: webhook.id,
        event_type: payload.event,
        payload: payload,
        failed_at: new Date().toISOString(),
      },
    ]);

    return { success: false };
  }
}

function createWebhookSignature(payload: WebhookPayload, signingSecret: string): string {
  const message = JSON.stringify(payload);
  return crypto.createHmac("sha256", signingSecret).update(message).digest("hex");
}

/**
 * Verify webhook signature (for advertiser to verify webhook is from us)
 */
export function verifyWebhookSignature(payload: string, signature: string, signingSecret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", signingSecret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Get webhook delivery status
 */
export async function getWebhookStatus(webhookId: string): Promise<{
  active: boolean;
  failureCount: number;
  lastTriggered: string | null;
  recentDeliveries: Array<{ status: number; timestamp: string }>;
}> {
  const client = createAdminClient();

  const { data: webhook } = await client
    .from("advertiser_webhooks")
    .select("active, failure_count, last_triggered_at")
    .eq("id", webhookId)
    .single();

  const { data: deliveries } = await client
    .from("webhook_delivery_log")
    .select("http_status, delivered_at")
    .eq("webhook_id", webhookId)
    .order("delivered_at", { ascending: false })
    .limit(10);

  return {
    active: webhook?.active || false,
    failureCount: webhook?.failure_count || 0,
    lastTriggered: webhook?.last_triggered_at,
    recentDeliveries: (deliveries || []).map((d) => ({
      status: d.http_status || 0,
      timestamp: d.delivered_at || new Date().toISOString(),
    })),
  };
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedWebhooks(webhookId: string): Promise<{ success: boolean; retriedCount: number }> {
  const client = createAdminClient();

  // Get failed deliveries
  const { data: failedDeliveries } = await client
    .from("webhook_delivery_log")
    .select("*")
    .eq("webhook_id", webhookId)
    .is("delivered_at", null)
    .order("attempted_at", { ascending: true })
    .limit(10);

  if (!failedDeliveries || failedDeliveries.length === 0) {
    return { success: true, retriedCount: 0 };
  }

  // Get webhook
  const { data: webhook } = await client
    .from("advertiser_webhooks")
    .select("*")
    .eq("id", webhookId)
    .single();

  if (!webhook) {
    return { success: false, retriedCount: 0 };
  }

  // Retry each failed delivery
  let retriedCount = 0;
  for (const delivery of failedDeliveries) {
    const result = await deliverWebhook(webhook, delivery.payload, client);
    if (result.success) {
      retriedCount++;
    }
  }

  return { success: true, retriedCount };
}
