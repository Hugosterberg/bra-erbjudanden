import { randomUUID } from "node:crypto";

import { sendSubscriberConfirmation } from "@/features/newsletter/confirmation";
import { isMailerConfigured } from "@/features/newsletter/mailer";
import { recordDiscoveryEvent } from "@/features/tracking/discovery-events";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { parseInterestIds } from "./interests";
import { subscriberSchema } from "./schemas";

const newsletterConsentText =
  "Jag vill få erbjudanden och kampanjer via e-post från braerbjudanden.se.";

export type SubscriberResult = {
  ok: boolean;
  message: string;
};

export const initialSubscriberState: SubscriberResult = {
  ok: false,
  message: "",
};

const CONFIRMATION_RESEND_INTERVAL_MS = 60 * 60 * 1000;

const SAVE_FAILED: SubscriberResult = {
  ok: false,
  message: "Kunde inte spara just nu. Försök igen om en stund.",
};

function normalizeSource(source: string) {
  const trimmed = source.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
}

/**
 * The answer is the same whether or not the address is already on the list, so
 * the form cannot be used to find out who subscribes. Nobody becomes active
 * until they have confirmed from their own inbox.
 */
function successMessage() {
  return isMailerConfigured()
    ? "Nästan klart! Vi har skickat ett mejl där du bekräftar din adress."
    : "Tack! Vi har sparat din adress och ber dig bekräfta den när utskicken startar.";
}

export async function registerDealSubscriber(input: FormData): Promise<SubscriberResult> {
  const parsed = subscriberSchema.safeParse({
    email: String(input.get("email") ?? ""),
    source: String(input.get("source") ?? "homepage"),
    company: String(input.get("company") ?? ""),
    interests: input.getAll("interests").map(String),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Kontrollera e-postadressen.",
    };
  }

  // Honeypot: bots get the normal answer but nothing is stored.
  if (parsed.data.company) {
    return { ok: true, message: successMessage() };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return SAVE_FAILED;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = normalizeSource(parsed.data.source);
  const interests = parseInterestIds(parsed.data.interests ?? []);
  const now = new Date().toISOString();

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("deal_subscribers")
      .select("id, status, signup_count, signup_sources, interests, confirmation_token, confirmation_sent_at")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] Subscriber lookup failed", lookupError);
      return SAVE_FAILED;
    }

    if (existing?.status === "active") {
      const { error } = await supabase
        .from("deal_subscribers")
        .update({
          last_signup_at: now,
          signup_count: existing.signup_count + 1,
          interests: Array.from(new Set([...(existing.interests ?? []), ...interests])),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("[newsletter] Subscriber update failed", error);
        return SAVE_FAILED;
      }
    } else {
      const sources = existing?.signup_sources ?? [];
      // The form must not be usable for flooding someone else's inbox.
      const recentlySentAt =
        existing?.status === "pending" &&
        existing.confirmation_sent_at &&
        Date.now() - new Date(existing.confirmation_sent_at).getTime() < CONFIRMATION_RESEND_INTERVAL_MS
          ? existing.confirmation_sent_at
          : null;
      const row = {
        email,
        status: "pending" as const,
        source,
        consent_text: newsletterConsentText,
        consent_given_at: now,
        last_signup_at: now,
        signup_count: (existing?.signup_count ?? 0) + 1,
        signup_sources: sources.includes(source) ? sources : [...sources, source],
        interests: Array.from(new Set([...(existing?.interests ?? []), ...interests])),
        // A person who has left needs a new token before they can come back.
        confirmation_token: existing?.confirmation_token ?? randomUUID(),
        confirmation_sent_at: recentlySentAt,
      };

      const { data: saved, error } = existing
        ? await supabase
            .from("deal_subscribers")
            .update(row)
            .eq("id", existing.id)
            .select("id, email, confirmation_token")
            .single()
        : await supabase
            .from("deal_subscribers")
            .insert(row)
            .select("id, email, confirmation_token")
            .single();

      if (error || !saved) {
        console.error("[newsletter] Subscriber save failed", error);
        return SAVE_FAILED;
      }

      if (isMailerConfigured() && !recentlySentAt) {
        await sendSubscriberConfirmation(saved);
      }
    }
  } catch (error) {
    console.error("[newsletter] Signup request failed", error);
    return SAVE_FAILED;
  }

  await recordDiscoveryEvent({
    eventType: "newsletter_signup",
    entityType: "subscriber",
    metadata: { source, interests: interests.join(",") },
  });

  return { ok: true, message: successMessage() };
}

const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidToken(token: string | null | undefined): token is string {
  return Boolean(token && TOKEN_PATTERN.test(token));
}

export async function confirmSubscriberByToken(token: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !isValidToken(token)) {
    return false;
  }

  const { data } = await supabase
    .from("deal_subscribers")
    .update({
      status: "active",
      confirmed_at: new Date().toISOString(),
      confirmation_token: null,
      unsubscribed_at: null,
    })
    .eq("confirmation_token", token)
    .eq("status", "pending")
    .select("id");

  return (data?.length ?? 0) > 0;
}

export async function unsubscribeByToken(token: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !isValidToken(token)) {
    return false;
  }

  const { data } = await supabase
    .from("deal_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("id");

  return (data?.length ?? 0) > 0;
}
