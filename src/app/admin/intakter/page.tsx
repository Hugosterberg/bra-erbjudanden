import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";
import { RevenueDashboard } from "@/features/monetization/components/revenue-dashboard";
import { calculateRevenueMetrics, calculateNetworkRevenueMetrics } from "@/features/monetization/queries";
import { AFFILIATE_NETWORKS } from "@/features/affiliate-import/types";

export const metadata = createMetadata({
  title: "Intäkter",
  description: "Revenue analytics och intäktsspårning.",
  path: "/admin/intakter",
});

export default async function AdminRevenuePage() {
  await requireAdmin();

  // Calculate metrics for last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString();
  const endDate = now.toISOString();

  const [metrics, ...networkMetricsPromises] = await Promise.all([
    calculateRevenueMetrics(startDate, endDate),
    ...AFFILIATE_NETWORKS.map((network) => calculateNetworkRevenueMetrics(network, startDate, endDate)),
  ]);

  const networkMetrics = await Promise.all(networkMetricsPromises);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Intäkter</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Revenue analytics för de senaste 30 dagarna
          </p>
        </div>

        <RevenueDashboard metrics={metrics} networkMetrics={networkMetrics} />

        <div className="rounded-lg border bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100">💡 Tips</h2>
          <ul className="mt-2 space-y-1 text-sm text-blue-900 dark:text-blue-100">
            <li>• Följa trending networks för att optimera fokus</li>
            <li>• Testa sponsorships för högra-ranking offers</li>
            <li>• Monitorera konverteringsfrekvensen per nätverk</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
