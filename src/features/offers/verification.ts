const WEEK_IN_HOURS = 168;

export function isRecentlyVerified(
  lastVerifiedAt: string | null | undefined,
  now = new Date(),
  maxAgeHours = WEEK_IN_HOURS,
) {
  if (!lastVerifiedAt) {
    return false;
  }

  const hours = (now.getTime() - new Date(lastVerifiedAt).getTime()) / 3_600_000;
  return hours >= 0 && hours <= maxAgeHours;
}
