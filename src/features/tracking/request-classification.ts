/**
 * Decides which requests to an outbound route are real clicks. next/link and
 * browsers prefetch links that merely scroll into view, which would otherwise
 * be counted as clicks and fed into Deal Score and popularity sorting.
 */
const BOT_USER_AGENT =
  /bot\b|bot\/|crawl|spider|slurp|preview|headless|lighthouse|monitor|facebookexternalhit|embedly|whatsapp|curl|wget|python-requests|node-fetch|axios|go-http-client/i;

type HeaderReader = Pick<Headers, "get">;

export function isPrefetchRequest(method: string, headers: HeaderReader) {
  if (method === "HEAD") {
    return true;
  }

  const purpose = `${headers.get("sec-purpose") ?? ""} ${headers.get("purpose") ?? ""}`;

  return (
    headers.get("rsc") !== null ||
    headers.get("next-router-prefetch") !== null ||
    purpose.toLowerCase().includes("prefetch")
  );
}

export function isLikelyBot(userAgent: string | null) {
  return !userAgent || BOT_USER_AGENT.test(userAgent);
}
