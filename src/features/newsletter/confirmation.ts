import { siteConfig } from "@/shared/config/site";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getEmailSender, sendEmail } from "./mailer";
import { buildConfirmationEmail } from "./templates";

export async function sendSubscriberConfirmation(subscriber: {
  id: string;
  email: string;
  confirmation_token: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !subscriber.confirmation_token) {
    return false;
  }

  try {
    await sendEmail({
      to: subscriber.email,
      ...buildConfirmationEmail({
        confirmUrl: `${siteConfig.url}/nyhetsbrev/bekrafta?token=${subscriber.confirmation_token}`,
        sender: getEmailSender(),
      }),
    });
  } catch (error) {
    console.error("[newsletter] Confirmation email failed", error);
    return false;
  }

  await supabase
    .from("deal_subscribers")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", subscriber.id);

  return true;
}
