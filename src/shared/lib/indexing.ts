/**
 * A landing page is only worth indexing when it carries content a visitor
 * could act on. A short description alone is not enough: a store or category
 * without offers or editorial content is a thin page, and indexing it hurts
 * the whole domain.
 */
const MIN_INTRO_LENGTH = 120;

export type LandingPageContent = {
  offerCount: number;
  articleCount?: number;
  intro?: string | null;
  description?: string | null;
};

export function hasIndexableContent(content: LandingPageContent) {
  if (content.offerCount > 0) {
    return true;
  }

  if ((content.articleCount ?? 0) > 0) {
    return true;
  }

  const copy = (content.intro ?? content.description ?? "").trim();
  return copy.length >= MIN_INTRO_LENGTH;
}
