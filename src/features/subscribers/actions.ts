"use server";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { subscriberSchema } from "./schemas";

const newsletterConsentText =
  "Jag vill få erbjudanden och kampanjer via e-post från braerbjudanden.se.";

export type SubscriberActionState = {
  ok: boolean;
  message: string;
};

const initialSubscriberState: SubscriberActionState = {
  ok: false,
  message: "",
};

export { initialSubscriberState };

export async function subscribeToDealsAction(
  _state: SubscriberActionState,
  formData: FormData,
): Promise<SubscriberActionState> {
  const parsed = subscriberSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    source: String(formData.get("source") ?? "homepage"),
    company: String(formData.get("company") ?? ""),
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

  const { error } = await supabase.rpc("register_deal_subscriber", {
    p_email: parsed.data.email,
    p_source: parsed.data.source,
    p_consent_text: newsletterConsentText,
  });

  if (error) {
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
