export function isOfferExpired(endsAt: string | null | undefined, now = new Date()) {
  if (!endsAt) {
    return false;
  }

  return new Date(endsAt).getTime() <= now.getTime();
}

export function isOfferStarted(startsAt: string | null | undefined, now = new Date()) {
  if (!startsAt) {
    return true;
  }

  return new Date(startsAt).getTime() <= now.getTime();
}

export function isOfferActive(input: {
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
}, now = new Date()) {
  return (
    input.status === "published" &&
    isOfferStarted(input.startsAt, now) &&
    !isOfferExpired(input.endsAt, now)
  );
}
