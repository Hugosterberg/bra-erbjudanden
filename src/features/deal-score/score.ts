export type DealScoreInput = {
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt?: string | null;
  endsAt?: string | null;
  isFeatured?: boolean;
  isSponsored?: boolean;
  clickCount?: number;
  feedbackPositive?: number;
  feedbackTotal?: number;
  now?: Date;
};

export type DealScoreBreakdown = {
  discount: number;
  freshness: number;
  verification: number;
  feedback: number;
  popularity: number;
  exclusivity: number;
  urgency: number;
};

export type DealScoreResult = {
  score: number;
  breakdown: DealScoreBreakdown;
};

const MIN_FEEDBACK_VOTES = 5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hoursBetween(from: string, now: Date) {
  return (now.getTime() - new Date(from).getTime()) / 3_600_000;
}

function scoreDiscount(type: DealScoreInput["discountType"], value: number) {
  if (type === "percentage") {
    return clamp((value / 80) * 35, 0, 35);
  }

  return clamp((value / 500) * 28, 0, 28);
}

function scoreFreshness(createdAt: string, updatedAt: string, now: Date) {
  const hours = Math.min(hoursBetween(createdAt, now), hoursBetween(updatedAt, now));
  if (hours <= 24) {
    return 15;
  }
  if (hours <= 72) {
    return 12;
  }
  if (hours <= 168) {
    return 8;
  }
  if (hours <= 336) {
    return 4;
  }
  return 1;
}

function scoreVerification(lastVerifiedAt: string | null | undefined, now: Date) {
  if (!lastVerifiedAt) {
    return 4;
  }

  const hours = hoursBetween(lastVerifiedAt, now);
  if (hours <= 48) {
    return 15;
  }
  if (hours <= 168) {
    return 10;
  }
  if (hours <= 336) {
    return 6;
  }
  return 3;
}

function scoreFeedback(positive: number, total: number) {
  if (total < MIN_FEEDBACK_VOTES) {
    return 5;
  }

  return clamp((positive / total) * 15, 0, 15);
}

function scorePopularity(clicks: number) {
  return clamp(Math.log10(clicks + 1) * 5, 0, 10);
}

function scoreUrgency(endsAt: string | null | undefined, now: Date) {
  if (!endsAt) {
    return 2;
  }

  const hoursLeft = (new Date(endsAt).getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft <= 0) {
    return 0;
  }
  if (hoursLeft <= 24) {
    return 5;
  }
  if (hoursLeft <= 72) {
    return 4;
  }
  return 2;
}

export function calculateDealScore(input: DealScoreInput): DealScoreResult {
  const now = input.now ?? new Date();
  const breakdown: DealScoreBreakdown = {
    discount: scoreDiscount(input.discountType, input.discountValue),
    freshness: scoreFreshness(input.createdAt, input.updatedAt, now),
    verification: scoreVerification(input.lastVerifiedAt, now),
    feedback: scoreFeedback(input.feedbackPositive ?? 0, input.feedbackTotal ?? 0),
    popularity: scorePopularity(input.clickCount ?? 0),
    exclusivity: input.isFeatured ? 5 : 0,
    urgency: scoreUrgency(input.endsAt, now),
  };

  // Sponsored placement must never inflate the editorial ranking.
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    score: Math.round(clamp(total, 0, 100)),
    breakdown,
  };
}

export function formatDealScoreLabel(score: number) {
  return `Deal Score ${score}/100`;
}
