/**
 * Knows how each network's tracking links look and how a click reference is
 * carried on them. This module is pure so that it can be tested in isolation.
 */
export type TrackableNetwork = "addrevenue" | "adtraction" | "adrecord" | "awin" | "tradedoubler";

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function matchesHost(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectNetworkFromUrl(value: string | null | undefined): TrackableNetwork | null {
  const url = value ? parseUrl(value) : null;
  if (!url) {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (matchesHost(host, "awin1.com") || matchesHost(host, "tidd.ly")) {
    return "awin";
  }
  if (matchesHost(host, "tradedoubler.com")) {
    return "tradedoubler";
  }
  if (matchesHost(host, "addrevenue.io")) {
    return "addrevenue";
  }
  if (matchesHost(host, "adrecord.com")) {
    return "adrecord";
  }
  // Adtraction also serves links from alias and first-party hosts, but keeps
  // the /t/t path with adId (a) and channelId (as) on all of them.
  if (
    matchesHost(host, "adtraction.com") ||
    matchesHost(host, "adtraction.net") ||
    (url.pathname === "/t/t" && url.searchParams.has("a") && url.searchParams.has("as"))
  ) {
    return "adtraction";
  }

  return null;
}

/** A link that only points at the store earns nothing, so imports reject it. */
export function isTrackingUrl(network: TrackableNetwork, value: string | null | undefined) {
  return detectNetworkFromUrl(value) === network;
}

/**
 * Addrevenue documents no sub-ID parameter for links, so it stays off until a
 * test purchase has confirmed one. See docs/ai/decisions.md.
 */
function clickReferenceParam(network: TrackableNetwork, addrevenueParam?: string | null) {
  switch (network) {
    case "awin":
      return "clickref";
    case "adtraction":
    case "adrecord":
    case "tradedoubler":
      return "epi";
    case "addrevenue":
      return addrevenueParam?.trim() || null;
  }
}

export function appendClickReference(
  value: string,
  network: TrackableNetwork | null,
  clickReference: string,
  options: { addrevenueParam?: string | null } = {},
) {
  const param = network ? clickReferenceParam(network, options.addrevenueParam) : null;
  const url = parseUrl(value);

  if (!param || !url) {
    return value;
  }

  // Older Tradedoubler links use click?p(1)a(2)g(3) and must not mix formats.
  if (network === "tradedoubler" && /[?&]p\(/.test(value)) {
    if (/\bepi\(/.test(value)) {
      return value;
    }

    const urlSegment = value.indexOf("url(");
    return urlSegment === -1
      ? `${value}epi(${clickReference})`
      : `${value.slice(0, urlSegment)}epi(${clickReference})${value.slice(urlSegment)}`;
  }

  // Never overwrite a reference someone placed on the link deliberately.
  if (url.searchParams.has(param)) {
    return value;
  }

  // Inserted first because several networks read an unencoded destination from
  // the end of the query string, which would swallow a trailing parameter.
  // String surgery keeps the existing encoding of the link byte for byte.
  const encoded = `${param}=${encodeURIComponent(clickReference)}`;
  const queryStart = value.indexOf("?");
  if (queryStart !== -1) {
    return `${value.slice(0, queryStart + 1)}${encoded}&${value.slice(queryStart + 1)}`;
  }

  const hashStart = value.indexOf("#");
  return hashStart === -1
    ? `${value}?${encoded}`
    : `${value.slice(0, hashStart)}?${encoded}${value.slice(hashStart)}`;
}

/** Click ids are UUIDs written without dashes: some networks reject punctuation. */
export function toClickReference(clickId: string) {
  return clickId.replaceAll("-", "");
}

export function parseClickReference(value: string | null | undefined) {
  const compact = value?.trim().toLowerCase().replaceAll("-", "") ?? "";
  if (!/^[0-9a-f]{32}$/.test(compact)) {
    return null;
  }

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join("-");
}
