"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { PublisherRevenueDaily } from "../types";

interface PublisherRevenueDashboardProps {
  dailyRevenue: PublisherRevenueDaily[];
  totalAffiliateRevenue: number;
  totalAdNetworkRevenue: number;
  totalRevenue: number;
  affiliateMetrics: { clicks: number; cpc: number };
  adMetrics: { impressions: number; clicks: number; ctr: number };
  forecast?: { affiliate: number; ads: number; total: number };
}

export function PublisherRevenueDashboard({
  dailyRevenue,
  totalAffiliateRevenue,
  totalAdNetworkRevenue,
  totalRevenue,
  affiliateMetrics,
  adMetrics,
  forecast,
}: PublisherRevenueDashboardProps) {
  const chartData = dailyRevenue.map((day) => ({
    date: new Date(day.date).toLocaleDateString("sv-SE"),
    affiliate: day.affiliate_revenue_sek || 0,
    ads: day.ad_network_revenue_sek || 0,
    total: day.total_revenue_sek || 0,
  }));

  const revenueShare = [
    { name: "Affiliate", value: totalAffiliateRevenue },
    { name: "Ad Network", value: totalAdNetworkRevenue },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Intäkter"
          value={`${totalRevenue.toFixed(0)} kr`}
          trend={forecast ? `↑ +${forecast.total.toFixed(0)} kr forcast` : undefined}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
        />
        <MetricCard
          label="Affiliate"
          value={`${totalAffiliateRevenue.toFixed(0)} kr`}
          subtext={`${affiliateMetrics.clicks} klick @ ${affiliateMetrics.cpc.toFixed(2)} kr/klick`}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
        />
        <MetricCard
          label="Ad Network"
          value={`${totalAdNetworkRevenue.toFixed(0)} kr`}
          subtext={`${adMetrics.impressions} impressions @ ${adMetrics.ctr.toFixed(2)}% CTR`}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Intäkter de senaste 30 dagarna</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(0)} kr`} />
            <Legend />
            <Line type="monotone" dataKey="affiliate" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="ads" stroke="#8b5cf6" strokeWidth={2} />
            <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Share */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-semibold text-neutral-900 dark:text-white">Intäktsandel</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={revenueShare} cx="50%" cy="50%" labelLine={false} label={renderLabel} outerRadius={80} fill="#8884d8" dataKey="value">
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(0)} kr`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue Bars */}
        <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-semibold text-neutral-900 dark:text-white">Daglig fördelning (senaste 7 dagar)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(0)} kr`} />
              <Legend />
              <Bar dataKey="affiliate" fill="#3b82f6" />
              <Bar dataKey="ads" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Prestanda sammanfattning</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Affiliate CTR</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{affiliateMetrics.cpc.toFixed(2)} kr</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">per klick</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ad Network CTR</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{adMetrics.ctr.toFixed(2)}%</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">click-through rate</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Affiliate andel</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {((totalAffiliateRevenue / totalRevenue) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">av total</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ad Network andel</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {((totalAdNetworkRevenue / totalRevenue) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">av total</p>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {forecast && (
        <div className="rounded-lg border border-dashed border-blue-400 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100">📊 30-dagars prognos</h2>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300">Affiliate</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{forecast.affiliate.toFixed(0)} kr</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300">Ad Network</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{forecast.ads.toFixed(0)} kr</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300">Totalt</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{forecast.total.toFixed(0)} kr</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtext, className = "" }: { label: string; value: string; subtext?: string; trend?: string; className?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtext}</p>}
    </div>
  );
}

function renderLabel({ name, value }: { name: string; value: number }) {
  const total = 2000; // Sum of all values
  const percent = ((value / total) * 100).toFixed(0);
  return `${name} ${percent}%`;
}
