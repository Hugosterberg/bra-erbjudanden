// @ts-nocheck
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { DollarSign, Eye, MousePointerClick, AlertCircle } from "lucide-react";

export const metadata = createMetadata({
  title: "Intäkter Pro - Advanced Monetization",
  description: "All-in-one monetization dashboard: affiliate, display ads, native ads, sponsored content",
  path: "/admin/intakter-pro",
});

export default async function AdminRevenuePlusPage() {
  await requireAdmin();
  const client = createAdminClient();

  // Get today's revenue breakdown
  const today = new Date().toISOString().split("T")[0];
  const { data: todayRevenue } = await client
    .from("revenue_report_daily")
    .select("*")
    .eq("date", today)
    .single();

  // Get last 30 days for trends
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: monthlyRevenue } = await client
    .from("revenue_report_daily")
    .select("*")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const totalMonthly = (monthlyRevenue || []).reduce((sum, day) => sum + (day.total_revenue_sek || 0), 0);
  const avgDaily = monthlyRevenue && monthlyRevenue.length > 0 ? totalMonthly / monthlyRevenue.length : 0;

  // Get monetization breakdown
  const affiliateTotal = (monthlyRevenue || []).reduce((sum, day) => sum + (day.affiliate_revenue_sek || 0), 0);
  const displayAdsTotal = (monthlyRevenue || []).reduce((sum, day) => sum + (day.display_ads_revenue_sek || 0), 0);
  const nativeAdsTotal = (monthlyRevenue || []).reduce((sum, day) => sum + (day.native_ads_revenue_sek || 0), 0);
  const sponsoredTotal = (monthlyRevenue || []).reduce((sum, day) => sum + (day.sponsored_content_revenue_sek || 0), 0);
  const headerBiddingTotal = (monthlyRevenue || []).reduce((sum, day) => sum + (day.header_bidding_revenue_sek || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Intäkter Pro — Alla kanaler
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Affiliate, display ads, native ads, sponsored content + header bidding
          </p>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            label="Idag totalt"
            value={`${(todayRevenue?.total_revenue_sek || 0).toFixed(0)} kr`}
            trend={`Avg: ${avgDaily.toFixed(0)} kr/dag`}
            bgColor="bg-green-50 dark:bg-green-950"
          />
          <StatCard
            icon={<Eye className="h-6 w-6" />}
            label="Impressions idag"
            value={`${(todayRevenue?.page_views || 0).toLocaleString("sv-SE")}`}
            trend={`CPM: ${((todayRevenue?.total_revenue_sek || 0) / ((todayRevenue?.page_views || 1) / 1000)).toFixed(2)} kr`}
            bgColor="bg-blue-50 dark:bg-blue-950"
          />
          <StatCard
            icon={<MousePointerClick className="h-6 w-6" />}
            label="Revenue per besökare"
            value={`${(todayRevenue?.revenue_per_visitor || 0).toFixed(2)} kr`}
            trend={`Target: 1.50 kr`}
            bgColor="bg-purple-50 dark:bg-purple-950"
          />
        </div>

        {/* 30-Day Breakdown by Channel */}
        <div className="rounded-lg border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Intäkter senaste 30 dagar — per kanal
          </h2>

          <div className="mt-6 space-y-4">
            {[
              { label: "Affiliate Links", value: affiliateTotal, color: "bg-blue-500", icon: "🔗" },
              { label: "Display Ads (Google, etc)", value: displayAdsTotal, color: "bg-amber-500", icon: "📢" },
              { label: "Native Ads", value: nativeAdsTotal, color: "bg-green-500", icon: "📰" },
              { label: "Sponsored Content", value: sponsoredTotal, color: "bg-pink-500", icon: "⭐" },
              { label: "Header Bidding", value: headerBiddingTotal, color: "bg-indigo-500", icon: "🏆" },
            ].map((channel) => (
              <div key={channel.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{channel.icon}</div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{channel.label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {((channel.value / totalMonthly) * 100).toFixed(0)}% av total
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {channel.value.toFixed(0)} kr
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-6 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">Total 30 dagar</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalMonthly.toFixed(0)} kr
              </p>
            </div>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Genomsnitt: {avgDaily.toFixed(0)} kr/dag
            </p>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Affiliate Performance */}
          <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">🔗 Affiliate Links</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-neutral-600 dark:text-neutral-400">
                Revenue: <span className="font-bold text-neutral-900 dark:text-white">{affiliateTotal.toFixed(0)} kr</span>
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                Share: <span className="font-bold text-neutral-900 dark:text-white">
                  {((affiliateTotal / totalMonthly) * 100).toFixed(0)}%
                </span>
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Från 5 svenska nätverk + smart placement optimization
              </p>
            </div>
            <button className="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Optimize Links
            </button>
          </div>

          {/* Display Ads Performance */}
          <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">📢 Display Ads</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-neutral-600 dark:text-neutral-400">
                Revenue: <span className="font-bold text-neutral-900 dark:text-white">{displayAdsTotal.toFixed(0)} kr</span>
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                Share: <span className="font-bold text-neutral-900 dark:text-white">
                  {((displayAdsTotal / totalMonthly) * 100).toFixed(0)}%
                </span>
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Google AdSense + OpenX + Rubicon + AppNexus
              </p>
            </div>
            <button className="mt-3 w-full rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">
              Manage Networks
            </button>
          </div>
        </div>

        {/* Opportunities */}
        <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">💡 Revenue Opportunities</h3>
              <ul className="mt-2 space-y-1 text-sm text-orange-800 dark:text-orange-200">
                <li>✓ Header bidding could add +40% more display revenue</li>
                <li>✓ Native ads integration: +20% without UX harm</li>
                <li>✓ Sponsored content partnerships: +30% new revenue stream</li>
                <li>✓ Smart affiliate placement: +25% affiliate revenue</li>
                <li>✓ Retargeting pixel setup: +35% repeat visitor revenue</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ActionButton label="Header Bidding" icon="🏆" href="#" />
          <ActionButton label="Native Ads" icon="📰" href="#" />
          <ActionButton label="Sponsored" icon="⭐" href="#" />
          <ActionButton label="Retargeting" icon="👁️" href="#" />
          <ActionButton label="A/B Tests" icon="🧪" href="#" />
        </div>

        {/* Optimization Tips */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">🚀 Optimization Tips</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• Run header bidding for display ads (30-50% revenue increase)</li>
            <li>• Test native ads in article sidebars (5-10% engagement lift)</li>
            <li>• Set up retargeting pixels for repeat visitors (+35% revenue)</li>
            <li>• Place affiliate links contextually in content (+25% CTR)</li>
            <li>• Monitor revenue floor rules to maximize CPM</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{trend}</p>}
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, href }: { label: string; icon: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-white p-3 text-center hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-neutral-900 dark:text-white">{label}</span>
    </a>
  );
}
