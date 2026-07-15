import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";

import { getConfiguredAdapters } from "@/features/affiliate-import/adapters";
import { ImportRunHistory } from "@/features/affiliate-import/components/import-run-history";
import { ImportStatusBadge } from "@/features/affiliate-import/components/import-status-badge";
import { ImportTriggerButton } from "@/features/affiliate-import/components/import-trigger-button";
import { NetworkImportRunHistory } from "@/features/affiliate-import/components/network-import-run-history";
import { NetworkStatusList } from "@/features/affiliate-import/components/network-status-list";
import { IMPORT_SCHEDULE_LABEL } from "@/features/affiliate-import/constants";
import {
  countImportedOffersByNetwork,
  countManualOffers,
  findLatestImportRun,
  findLatestNetworkImportByNetwork,
  findRecentImportRuns,
  findRecentNetworkImportRuns,
} from "@/features/affiliate-import/queries";

export const metadata = createMetadata({
  title: "Admin import",
  description: "Status och manuell körning av affiliate-import.",
  path: "/admin/import",
});

export default async function AdminImportPage() {
  await requireAdmin();

  const [latestRun, recentRuns, networkRuns, latestNetworkRuns, importedCounts, manualCount] =
    await Promise.all([
      findLatestImportRun(),
      findRecentImportRuns(5),
      findRecentNetworkImportRuns(24),
      findLatestNetworkImportByNetwork(),
      countImportedOffersByNetwork(),
      countManualOffers(),
    ]);

  const configuredCount = getConfiguredAdapters().length;
  const importedTotal = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);
  const failedNetworkRuns = networkRuns.filter((run) => run.status === "failed").slice(0, 5);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Affiliate-import</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Hämtar erbjudanden från konfigurerade nätverk, skapar butiker automatiskt och
              håller katalogen uppdaterad. Varje nätverk loggas separat så du ser exakt vad som
              gick fel. {IMPORT_SCHEDULE_LABEL}
            </p>
          </div>
          <ImportTriggerButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktiva nätverk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold" data-numeric>
                {configuredCount}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Importerade erbjudanden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold" data-numeric>
                {importedTotal}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Manuella erbjudanden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold" data-numeric>
                {manualCount}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Senaste körning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestRun ? (
                <>
                  <ImportStatusBadge status={latestRun.status} />
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("sv-SE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(latestRun.started_at))}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen körning ännu</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <NetworkStatusList
            importedCounts={importedCounts}
            latestRuns={latestNetworkRuns}
          />
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Så fungerar importen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Varje schemalagd körning skapar en batch. Inom batchen körs varje nätverk
                separat med egen logg, status och felmeddelanden.
              </p>
              <p>
                Utgångna erbjudanden arkiveras per nätverk – men bara när just det nätverkets
                feed svarar korrekt.
              </p>
              <p>
                Manuellt skapade erbjudanden behåller ranking 1–20. Importerade rankas från 21
                efter rabattstorlek inom respektive nätverk.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/erbjudanden">
                  <Download className="size-4" />
                  Hantera erbjudanden
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {failedNetworkRuns.length > 0 ? (
          <Card className="rounded-lg border-destructive/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Senaste misslyckade nätverksimporter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm">
                {failedNetworkRuns.map((run) => (
                  <li key={run.id} className="rounded-md border px-3 py-2">
                    <p className="font-medium">{run.affiliate_network}</p>
                    <p className="text-muted-foreground">{run.errors[0] ?? "Okänt fel"}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <NetworkImportRunHistory runs={networkRuns} />
        <ImportRunHistory runs={recentRuns} />
      </div>
    </AdminShell>
  );
}
