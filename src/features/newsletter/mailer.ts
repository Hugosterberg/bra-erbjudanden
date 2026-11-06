import { siteConfig } from "@/shared/config/site";

import type { EmailContent, Sender } from "./templates";

const RESEND_URL = "https://api.resend.com";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RATE_LIMIT_RETRIES = 3;

export type OutgoingEmail = EmailContent & {
  to: string;
  headers?: Record<string, string>;
};

function readMailerConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

export function isMailerConfigured() {
  return readMailerConfig() !== null;
}

export function getEmailSender(): Sender {
  return {
    siteName: siteConfig.name,
    siteUrl: siteConfig.url,
    companyName: siteConfig.company.name,
    address: siteConfig.company.address,
  };
}

function toResendPayload(email: OutgoingEmail, from: string) {
  return {
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(email.headers ? { headers: email.headers } : {}),
  };
}

async function postToResend(path: string, apiKey: string, body: unknown) {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`${RESEND_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) {
      return;
    }

    // Only 429 is retried: the request was refused, so nothing has been sent.
    // Other failures might have sent mail, and a retry could send it twice.
    if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const waitSeconds = Number(response.headers.get("retry-after")) || 1;
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitSeconds, 10) * 1000));
      continue;
    }

    const detail = await response.text().catch(() => "");
    throw new Error(`E-postleverantören svarade ${response.status}: ${detail.slice(0, 200)}`);
  }
}

export async function sendEmail(email: OutgoingEmail) {
  const config = readMailerConfig();
  if (!config) {
    throw new Error("E-post är inte konfigurerad (RESEND_API_KEY och NEWSLETTER_FROM_EMAIL).");
  }

  await postToResend("/emails", config.apiKey, toResendPayload(email, config.from));
}

/** Resend accepts at most 100 emails in one batch request. */
export const EMAIL_BATCH_SIZE = 100;

export async function sendEmailBatch(emails: OutgoingEmail[]) {
  const config = readMailerConfig();
  if (!config) {
    throw new Error("E-post är inte konfigurerad (RESEND_API_KEY och NEWSLETTER_FROM_EMAIL).");
  }

  await postToResend(
    "/emails/batch",
    config.apiKey,
    emails.map((email) => toResendPayload(email, config.from)),
  );
}
