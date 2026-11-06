import { siteConfig } from "@/shared/config/site";

import type { EmailContent, Sender } from "./templates";

const RESEND_URL = "https://api.resend.com";
const REQUEST_TIMEOUT_MS = 15_000;

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
  const response = await fetch(`${RESEND_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
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
