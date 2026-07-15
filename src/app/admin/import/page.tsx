import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";

import { buildNetworkImportProfiles, getCronSkippedNetworks } from "@/features/affiliate-import/config";
import { ImportDashboard } from "@/features/affiliate-import/components/import-dashboard";
import {
  countImportedOffersByNetwork,
  countManualOffers,
  findActiveImportRun,
  findLatestImportRun,
  findLatestNetworkImportByNetwork,
  findRecentImportRuns,
  findRecentNetworkImportRuns,
  findRunningNetworkImports,
} from "@/features/affiliate-import/queries";
import { AFFILIATE_NETWORKS, type AffiliateNetwork } from "@/features/affiliate-import/types";

export const metadata = createMetadata({
  title: "Affiliate-import",
  description: "Status och manuell körning av affiliate-import.",
  path: "/admin/import",
});

function parseTab(value: string | undefined): "networks" | "history" | "guides" | "info" {
  if (value === "history" || value === "guides" || value === "info") {
    return value;
  }

  return "networks";
}

function parseGuideNetwork(value: string | undefined): AffiliateNetwork | undefined {
  return AFFILIATE_NETWORKS.includes(value as AffiliateNetwork)
    ? (value as AffiliateNetwork)
    : undefined;
}

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; guide?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const initialTab = parseTab(params.tab);
  const initialGuideNetwork = parseGuideNetwork(params.guide);

  const [
    latestRun,
    activeRun,
    runningNetworks,
    recentRuns,
    networkRuns,
    latestNetworkRuns,
    importedCounts,
    manualCount,
  ] = await Promise.all([
    findLatestImportRun(),
    findActiveImportRun(),
    findRunningNetworkImports(),
    findRecentImportRuns(8),
    findRecentNetworkImportRuns(40),
    findLatestNetworkImportByNetwork(),
    countImportedOffersByNetwork(),
    countManualOffers(),
  ]);

  const profiles = buildNetworkImportProfiles(importedCounts);
  const configuredCount = profiles.filter((profile) => profile.configured).length;
  const importedTotal = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);
  const cronSkipped = getCronSkippedNetworks();

  return (
    <AdminShell>
      <ImportDashboard
        profiles={profiles}
        latestRun={latestRun}
        activeRun={activeRun}
        runningNetworks={runningNetworks}
        latestNetworkRuns={latestNetworkRuns}
        networkRuns={networkRuns}
        batchRuns={recentRuns}
        initialTab={initialTab}
        initialGuideNetwork={initialGuideNetwork}
        stats={{
          configuredCount,
          importedTotal,
          manualCount,
          cronSkipped,
        }}
      />
    </AdminShell>
  );
}
