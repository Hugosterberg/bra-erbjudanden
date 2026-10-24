export type CountableRevenueEvent = {
  event_type: string;
  revenue_usd?: number | null;
};

export type RevenueSummary = {
  totalRevenue: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  averageCpc: number | null;
  averageCpm: number | null;
  conversionRate: number;
};

export function summarizeRevenueEvents(events: CountableRevenueEvent[]): RevenueSummary {
  const clicks = events.filter((event) => event.event_type === "click").length;
  const impressions = events.filter((event) => event.event_type === "impression").length;
  const conversions = events.filter((event) => event.event_type === "conversion").length;
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue_usd || 0), 0);

  return {
    totalRevenue,
    totalClicks: clicks,
    totalImpressions: impressions,
    totalConversions: conversions,
    averageCpc: clicks > 0 ? totalRevenue / clicks : null,
    averageCpm: impressions > 0 ? (totalRevenue / impressions) * 1000 : null,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
  };
}

export function revenueTrend(events: CountableRevenueEvent[]): "up" | "down" | "flat" {
  const midpoint = Math.floor(events.length / 2);
  const firstHalfRevenue = events
    .slice(0, midpoint)
    .reduce((sum, event) => sum + (event.revenue_usd || 0), 0);
  const secondHalfRevenue = events
    .slice(midpoint)
    .reduce((sum, event) => sum + (event.revenue_usd || 0), 0);

  if (secondHalfRevenue > firstHalfRevenue * 1.1) return "up";
  if (secondHalfRevenue < firstHalfRevenue * 0.9) return "down";
  return "flat";
}
