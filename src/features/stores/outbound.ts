/**
 * Affiliate URLs are never rewritten, only chosen. When a store has an
 * affiliate link it wins over the plain website URL; existing tracking
 * parameters in that link are preserved as-is.
 */
export function resolveStoreOutboundUrl(store: {
  affiliate_url: string | null;
  website_url: string | null;
}) {
  const url = store.affiliate_url?.trim() || store.website_url?.trim() || "";
  return url.length > 0 ? url : null;
}

export function isAffiliateOutbound(store: { affiliate_url: string | null }) {
  return Boolean(store.affiliate_url?.trim());
}
