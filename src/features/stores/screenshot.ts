// Builds a homepage screenshot URL for a store website using WordPress mShots,
// a free, key-less screenshot service. The first request may briefly return a
// placeholder while the screenshot is generated, then the real capture is
// cached and served. Falls back handled by the consumer when this returns null.
export function getWebsiteScreenshotUrl(
  websiteUrl: string | null,
  width = 1200,
): string | null {
  if (!websiteUrl) {
    return null;
  }

  let normalized: string;

  try {
    normalized = new URL(
      websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
    ).toString();
  } catch {
    return null;
  }

  const height = Math.round((width * 9) / 16);

  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(
    normalized,
  )}?w=${width}&h=${height}`;
}
