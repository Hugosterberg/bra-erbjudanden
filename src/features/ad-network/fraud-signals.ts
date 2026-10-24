export type FraudAssessment = {
  riskScore: number;
  isFraudulent: boolean;
  flags: string[];
  notes: string;
};

export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

export function isSuspiciousUserAgent(userAgent: string): boolean {
  return userAgent.length < 10 || userAgent === "unknown" || /headless|curl|wget|python/i.test(userAgent);
}

export function isVpnIp(ipHash: string): boolean {
  return ipHash.startsWith("vpn_") || ipHash.startsWith("proxy_");
}

export function isInvalidReferrer(referrer: string): boolean {
  try {
    const url = new URL(referrer);
    return !url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

export function isUnusualClickTime(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 2 && hour <= 4;
}

export function assessClickFraud(input: {
  recentClicksFromIp: number;
  userAgent?: string;
  ipHash?: string;
  referrer?: string;
  unusualPattern: boolean;
  recentClicksInSession: number;
  now?: Date;
}): FraudAssessment {
  const flags: string[] = [];
  let riskScore = 0;

  if (input.ipHash && input.recentClicksFromIp > 5) {
    flags.push("rapid_clicks_same_ip");
    riskScore += 3;
  }

  if (input.userAgent) {
    if (isBot(input.userAgent)) {
      flags.push("bot_user_agent");
      riskScore += 4;
    }
    if (isSuspiciousUserAgent(input.userAgent)) {
      flags.push("suspicious_user_agent");
      riskScore += 2;
    }
  }

  if (input.ipHash && isVpnIp(input.ipHash)) {
    flags.push("vpn_detected");
    riskScore += 1;
  }

  if (input.unusualPattern) {
    flags.push("unusual_click_pattern");
    riskScore += 2;
  }

  if (input.referrer && isInvalidReferrer(input.referrer)) {
    flags.push("invalid_referrer");
    riskScore += 1.5;
  }

  if (input.recentClicksInSession > 2) {
    flags.push("multiple_clicks_same_session");
    riskScore += 2;
  }

  if (isUnusualClickTime(input.now)) {
    flags.push("unusual_click_time");
    riskScore += 0.5;
  }

  const notes = flags.length > 0 ? flags.join(", ") : "No suspicious indicators detected";

  return {
    riskScore: Math.min(10, riskScore),
    isFraudulent: riskScore >= 5,
    flags,
    notes,
  };
}
