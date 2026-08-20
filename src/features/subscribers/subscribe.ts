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

function normalizeSource(source: string) {
  const trimmed = source.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
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

  if (parsed.data.company) {
    return {
      ok: true,
      message: "Tack! Du är uppskriven.",
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Kunde inte spara just nu. Kontrollera Supabase-inställningarna.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = normalizeSource(parsed.data.source);
  const interests = parseInterestIds(parsed.data.interests ?? []);
  const now = new Date().toISOString();

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("deal_subscribers")
      .select("id, signup_count, signup_sources, interests")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] Subscriber lookup failed", lookupError);
      return {
        ok: false,
        message: "Kunde inte spara just nu. Försök igen om en stund.",
      };
    }

    if (existing) {
      const existingSources = existing.signup_sources ?? [];
      const signupSources = existingSources.includes(source)
        ? existingSources
        : [...existingSources, source];
      const mergedInterests = Array.from(
        new Set([...(existing.interests ?? []), ...interests]),
      );

      const { error } = await supabase
        .from("deal_subscribers")
        .update({
          status: "active",
          source,
          consent_text: newsletterConsentText,
          consent_given_at: now,
          last_signup_at: now,
          signup_count: existing.signup_count + 1,
          signup_sources: signupSources,
          interests: mergedInterests,
        })
        .eq("id", existing.id);

      if (error) {
        console.error("[newsletter] Subscriber update failed", error);
        return {
          ok: false,
          message: "Kunde inte spara just nu. Försök igen om en stund.",
        };
      }
    } else {
      const { error } = await supabase.from("deal_subscribers").insert({
        email,
        status: "active",
        source,
        consent_text: newsletterConsentText,
        consent_given_at: now,
        last_signup_at: now,
        signup_count: 1,
        signup_sources: [source],
        interests,
      });

      if (error) {
        console.error("[newsletter] Subscriber insert failed", error);
        return {
          ok: false,
          message: "Kunde inte spara just nu. Försök igen om en stund.",
        };
      }
    }
  } catch (error) {
    console.error("[newsletter] Signup request failed", error);

    return {
      ok: false,
      message: "Kunde inte spara just nu. Försök igen om en stund.",
    };
  }

  await recordDiscoveryEvent({
    eventType: "newsletter_signup",
    entityType: "subscriber",
    metadata: { source, interests: interests.join(",") },
  });

  return {
    ok: true,
    message: "Klart! Du är uppskriven för mailutskick med utvalda erbjudanden.",
  };
}
