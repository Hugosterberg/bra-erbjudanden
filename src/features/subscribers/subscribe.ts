import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

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

export async function registerDealSubscriber(input: FormData): Promise<SubscriberResult> {
  const parsed = subscriberSchema.safeParse({
    email: String(input.get("email") ?? ""),
    source: String(input.get("source") ?? "homepage"),
    company: String(input.get("company") ?? ""),
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

  try {
    const { error } = await supabase.rpc("register_deal_subscriber", {
      p_email: parsed.data.email,
      p_source: parsed.data.source,
      p_consent_text: newsletterConsentText,
    });

    if (error) {
      console.error("[newsletter] Supabase RPC failed", {
        code: error.code,
        message: error.message,
      });

      return {
        ok: false,
        message: "Kunde inte spara just nu. Försök igen om en stund.",
      };
    }
  } catch (error) {
    console.error("[newsletter] Signup request failed", error);

    return {
      ok: false,
      message: "Kunde inte spara just nu. Försök igen om en stund.",
    };
  }

  return {
    ok: true,
    message: "Klart! Du är uppskriven för mailutskick med utvalda erbjudanden.",
  };
}
