import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { Badge } from "@/components/ui/button";

export const metadata = createMetadata({
  title: "Annonser",
  description: "Ad network - kampanjer och annonsörer.",
  path: "/admin/annonser",
});

export default async function AdminAdsPage() {
  await requireAdmin();
  const client = createAdminClient();

  const [pendingCampaigns, activeCampaigns, advertisers, todayMetrics] = await Promise.all([
    client
      .from("ad_campaigns")
      .select("*, advertiser_accounts(business_name)")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false }),
    client
      .from("ad_campaigns")
      .select("*, advertiser_accounts(business_name)")
      .eq("status", "active")
      .gt("ends_at", new Date().toISOString())
      .order("bid_amount", { ascending: false }),
    client
      .from("advertiser_accounts")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    client
      .from("ad_metrics_daily")
      .select("SUM(impressions), SUM(clicks), SUM(spend_sek)")
      .eq("date", new Date().toISOString().split("T")[0]),
  ]);

  const todayStats = todayMetrics.data?.[0] || {
    sum_impressions: 0,
    sum_clicks: 0,
    sum_spend_sek: 0,
  };

  const totalSpend = todayStats.sum_spend_sek || 0;
  const platformFee = totalSpend * 0.2; // 20% platform fee

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Ad Network</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Hantera annonsörer och kampanjer</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Aktiva kampanjer" value={activeCampaigns.data?.length || 0} />
          <StatCard label="Väntande godkännande" value={pendingCampaigns.data?.length || 0} />
          <StatCard
            label="Idag intäkter"
            value={`${(platformFee || 0).toFixed(0)} kr`}
            subtext={`${todayStats.sum_impressions || 0} impressions`}
          />
          <StatCard label="Godkända annonsörer" value={advertisers.data?.length || 0} />
        </div>

        {/* Pending campaigns */}
        {pendingCampaigns.data && pendingCampaigns.data.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Väntande godkännande</h2>
            <div className="divide-y rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {pendingCampaigns.data.map((campaign: Record<string, unknown>) => (
                <div key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{campaign.name}</h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Från: {campaign.advertiser_accounts?.business_name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {campaign.campaign_type} • {campaign.pricing_model.toUpperCase()} • {campaign.bid_amount} SEK
                      </p>
                      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{campaign.description}</p>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-900 hover:bg-green-200 dark:bg-green-900 dark:text-green-100">
                        Godkänn
                      </button>
                      <button className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-200 dark:bg-red-900 dark:text-red-100">
                        Avslå
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active campaigns */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Aktiva kampanjer</h2>
          {activeCampaigns.data && activeCampaigns.data.length > 0 ? (
            <div className="divide-y rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {activeCampaigns.data.map((campaign: Record<string, unknown>) => (
                <div key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{campaign.name}</h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {campaign.advertiser_accounts?.business_name}
                      </p>
                      <Badge variant="default" className="mt-2">
                        {campaign.pricing_model.toUpperCase()}
                      </Badge>
                    </div>
                    <button className="rounded-lg bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">
                      Pausa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-neutral-600 dark:text-neutral-400">Inga aktiva kampanjer</p>
            </div>
          )}
        </div>

        {/* Quick info */}
        <div className="rounded-lg border bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Tips</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-900 dark:text-blue-100">
            <li>• 20% platform fee på alla annonser</li>
            <li>• CPM = Cost Per Mille (per 1000 impressions)</li>
            <li>• CPC = Cost Per Click</li>
            <li>• Godkänn endast kampanjer som är relevanta för braerbjudanden.se</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtext}</p>}
    </div>
  );
}
