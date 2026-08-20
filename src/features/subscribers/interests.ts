export const NEWSLETTER_INTERESTS = [
  { id: "teknik", label: "Teknik" },
  { id: "mode", label: "Mode" },
  { id: "hem", label: "Hem" },
  { id: "resor", label: "Resor" },
  { id: "skonhet", label: "Skönhet" },
  { id: "traning", label: "Träning" },
  { id: "barn", label: "Barn" },
] as const;

export type NewsletterInterestId = (typeof NEWSLETTER_INTERESTS)[number]["id"];

export function parseInterestIds(values: string[]) {
  const allowed = new Set(NEWSLETTER_INTERESTS.map((item) => item.id));
  return values.filter((value): value is NewsletterInterestId => allowed.has(value as NewsletterInterestId));
}
