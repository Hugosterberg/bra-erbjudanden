import type { PublisherRevenueDaily } from "../types-advanced";

interface PublisherRevenueDashboardProps {
  dailyRevenue: PublisherRevenueDaily[];
  totalAffiliateRevenue: number;
  totalAdNetworkRevenue: number;
  totalRevenue: number;
  affiliateMetrics: { clicks: number; cpc: number };
  adMetrics: { impressions: number; clicks: number; ctr: number };
  forecast?: { affiliate: number; ads: number; total: number };
}

function formatKronor(value: number): string {
  return `${value.toFixed(0)} kr`;
}

function sharePercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(0)}%`;
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
  const rows = dailyRevenue.map((day) => ({
    date: new Date(day.date).toLocaleDateString("sv-SE"),
    affiliate: day.affiliate_revenue_sek || 0,
    ads: day.ad_network_revenue_sek || 0,
    total: day.total_revenue_sek || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Intäkter"
          value={formatKronor(totalRevenue)}
          trend={forecast ? `Prognos ${formatKronor(forecast.total)}` : undefined}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
        />
        <MetricCard
          label="Affiliate"
          value={formatKronor(totalAffiliateRevenue)}
          subtext={`${affiliateMetrics.clicks} klick @ ${affiliateMetrics.cpc.toFixed(2)} kr/klick`}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
        />
        <MetricCard
          label="Ad Network"
          value={formatKronor(totalAdNetworkRevenue)}
          subtext={`${adMetrics.impressions} impressions @ ${adMetrics.ctr.toFixed(2)}% CTR`}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950"
        />
      </div>

      <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Intäkter per dag</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Ingen dagsdata ännu.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Datum</th>
                  <th className="py-2 pr-4 font-medium">Affiliate</th>
                  <th className="py-2 pr-4 font-medium">Annonser</th>
                  <th className="py-2 font-medium">Totalt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.date} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-4">{row.date}</td>
                    <td className="py-2 pr-4">{formatKronor(row.affiliate)}</td>
                    <td className="py-2 pr-4">{formatKronor(row.ads)}</td>
                    <td className="py-2">{formatKronor(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Prestanda sammanfattning</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Affiliate CPC</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {affiliateMetrics.cpc.toFixed(2)} kr
            </p>
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
              {sharePercent(totalAffiliateRevenue, totalRevenue)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">av total</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ad Network andel</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {sharePercent(totalAdNetworkRevenue, totalRevenue)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">av total</p>
          </div>
        </div>
      </div>

      {forecast && (
        <div className="rounded-lg border border-dashed border-blue-400 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100">30-dagars prognos</h2>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300">Affiliate</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatKronor(forecast.affiliate)}</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300">Ad Network</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatKronor(forecast.ads)}</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300">Totalt</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatKronor(forecast.total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  trend,
  className = "",
}: {
  label: string;
  value: string;
  subtext?: string;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtext}</p>}
      {trend && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{trend}</p>}
    </div>
  );
}
