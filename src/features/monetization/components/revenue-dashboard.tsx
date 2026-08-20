// @ts-nocheck
"use client";

import { TrendingUp } from "lucide-react";
import type { NetworkRevenueMetrics, RevenueMetrics } from "../types";
import type { AffiliateNetwork } from "@/features/affiliate-import/types";

interface RevenueDashboardProps {
  metrics: RevenueMetrics;
  networkMetrics: NetworkRevenueMetrics[];
  loading?: boolean;
}

function formatCurrency(value: number | null, currency = "USD"): string {
  if (value === null || value === undefined) return "-";
  const formatter = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency === "SEK" ? "SEK" : "USD",
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("sv-SE").format(value);
}

export function RevenueDashboard({ metrics, networkMetrics, loading = false }: RevenueDashboardProps) {
  if (loading) {
    return <div className="text-center text-neutral-500">Laddar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Total metrics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Totala intäkter"
          value={formatCurrency(metrics.totalRevenue)}
          subtext={`${formatNumber(metrics.totalClicks)} klick`}
        />
        <MetricCard
          label="Genomsnittlig CPC"
          value={formatCurrency(metrics.averageCpc)}
          subtext="Cost Per Click"
        />
        <MetricCard
          label="Genomsnittlig CPM"
          value={formatCurrency(metrics.averageCpm)}
          subtext="Cost Per 1000 impressions"
        />
        <MetricCard
          label="Konverteringsfrekvens"
          value={`${(metrics.conversionRate || 0).toFixed(2)}%`}
          subtext={`${formatNumber(metrics.totalConversions)} konverteringar`}
        />
      </div>

      {/* Network breakdown */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Per affiliatenätverk</h2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          {networkMetrics.map((metric) => (
            <NetworkCard key={metric.network} metric={metric} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtext}</p>}
    </div>
  );
}

function NetworkCard({ metric }: { metric: NetworkRevenueMetrics }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">{formatNetworkLabel(metric.network)}</h3>
          <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(metric.totalRevenue)}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
            metric.trend === "up"
              ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
              : metric.trend === "down"
                ? "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100"
                : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
          }`}
        >
          <TrendingUp className={`h-4 w-4 ${metric.trend === "down" ? "rotate-180" : ""}`} />
          {metric.trend === "up" ? "Upp" : metric.trend === "down" ? "Ner" : "Flat"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-neutral-600 dark:text-neutral-400">Klick</p>
          <p className="font-semibold text-neutral-900 dark:text-white">{formatNumber(metric.totalClicks)}</p>
        </div>
        <div>
          <p className="text-neutral-600 dark:text-neutral-400">Konverteringar</p>
          <p className="font-semibold text-neutral-900 dark:text-white">{formatNumber(metric.totalConversions)}</p>
        </div>
        <div>
          <p className="text-neutral-600 dark:text-neutral-400">Genomsnittlig CPC</p>
          <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(metric.averageCpc)}</p>
        </div>
        <div>
          <p className="text-neutral-600 dark:text-neutral-400">Konv.frekvens</p>
          <p className="font-semibold text-neutral-900 dark:text-white">{(metric.conversionRate || 0).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}

function formatNetworkLabel(network: AffiliateNetwork): string {
  const labels: Record<AffiliateNetwork, string> = {
    addrevenue: "Addrevenue",
    adtraction: "Adtraction",
    adrecord: "Adrecord",
    awin: "Awin",
    tradedoubler: "Tradedoubler",
  };
  return labels[network] || network;
}
