import { redirect } from "next/navigation";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { createClient } from "@/shared/lib/supabase/server";

export const metadata = {
  title: "Advertiser Dashboard",
  description: "Campaign analytics and performance metrics",
};

export default async function AdvertiserDashboardPage() {
  const client = createClient();

  // Get advertiser from API key (would need auth implementation)
  // For now, this is a template
  const apiKey = ""; // Would come from auth

  if (!apiKey) {
    redirect("/advertiser/login");
  }

  // Fetch campaigns
  const { data: campaigns } = await client
    .from("ad_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch metrics
  const { data: metrics } = await client
    .from("ad_metrics_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  const chartData = (metrics || [])
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString("sv-SE"),
      impressions: m.impressions,
      clicks: m.clicks,
      spend: m.spend_sek,
      ctr: m.ctr,
    }));

  const totalMetrics = (metrics || []).reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      clicks: acc.clicks + (m.clicks || 0),
      spend: acc.spend + (m.spend_sek || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0 },
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Annonsördashboard</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Se prestanda för dina kampanjer</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Impressions" value={totalMetrics.impressions.toLocaleString("sv-SE")} />
          <MetricCard label="Klick" value={totalMetrics.clicks.toLocaleString("sv-SE")} />
          <MetricCard label="CTR" value={`${((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2)}%`} />
          <MetricCard label="Spend" value={`${totalMetrics.spend.toFixed(0)} SEK`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Impressions & Clicks Trend */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Impressions & Klick</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#3b82f6" />
                <Line type="monotone" dataKey="clicks" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Spend Trend */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Daglig spend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(0)} SEK`} />
                <Bar dataKey="spend" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Aktiva kampanjer</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">Namn</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">Bid</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">Budget</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">Slut datum</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white">{campaign.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-900 dark:text-white">{campaign.bid_amount.toFixed(2)} SEK</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-900 dark:text-white">
                      {campaign.total_budget_sek ? `${campaign.total_budget_sek.toFixed(0)} SEK` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(campaign.ends_at).toLocaleDateString("sv-SE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Tips för bättre prestanda</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• CTR under 0.5%? Testa nya bilder och kopior</li>
            <li>• Höga kostnader? Vi rekommenderar lägre bud</li>
            <li>• Aktivera A/B testning för att hitta vinnare</li>
            <li>• Kontrollera dina webhook för real-time updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending_approval: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
