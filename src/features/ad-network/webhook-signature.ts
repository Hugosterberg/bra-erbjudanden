import crypto from "crypto";

export function createWebhookSignature(payload: string, signingSecret: string): string {
  return crypto.createHmac("sha256", signingSecret).update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string, signingSecret: string): boolean {
  const expectedSignature = createWebhookSignature(payload, signingSecret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
