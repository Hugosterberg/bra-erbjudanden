import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { createMetadata } from "@/shared/lib/seo";

import { ImportRunHistory } from "@/features/affiliate-import/components/import-run-history";
import { ImportTriggerButton } from "@/features/affiliate-import/components/import-trigger-button";
import { NetworkStatusList } from "@/features/affiliate-import/components/network-status-list";
import { IMPORT_SCHEDULE_LABEL } from "@/features/affiliate-import/constants";
import { getConfiguredAdapters } from "@/features/affiliate-import/adapters";
import {
  countImportedOffersByNetwork,
  countManualOffers,
  findLatestImportRun,
  findRecentImportRuns,
} from "@/features/affiliate-import/queries";

export const metadata = createMetadata({
  title: "Admin import",
  description: "Status och manuell körning av affiliate-import.",
  path: "/admin/import",
});

export default async function AdminImportPage() {
  await requireAdmin();

  const [latestRun, recentRuns, importedCounts, manualCount] = await Promise.all([
    findLatestImportRun(),
    findRecentImportRuns(8),
    countImportedOffersByNetwork(),
    countManualOffers(),
  ]);

  const configuredCount = getConfiguredAdapters().length;
  const importedTotal = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Affiliate-import</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Hämtar erbjudanden från konfigurerade nätverk, skapar butiker automatiskt och
              håller katalogen uppdaterad. {IMPORT_SCHEDULE_LABEL}
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
                  <Badge variant={latestRun.status === "completed" ? "default" : "secondary"}>
                    {latestRun.status}
                  </Badge>
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
          <NetworkStatusList importedCounts={importedCounts} />
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Så fungerar importen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Varje körning hämtar feeds från aktiva nätverk, normaliserar data till er
                erbjudandemodell och deduplicerar via externa ID:n.
              </p>
              <p>
                Utgångna eller borttagna erbjudanden arkiveras automatiskt – men bara när feeden
                svarar korrekt, så att ett API-fel inte rensar hela katalogen.
              </p>
              <p>
                Manuellt skapade erbjudanden behåller ranking 1–20. Importerade erbjudanden rankas
                därefter efter rabattstorlek.
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

        {latestRun?.errors.length ? (
          <Card className="rounded-lg border-destructive/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Varningar senaste körning</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                {latestRun.errors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <ImportRunHistory runs={recentRuns} />
      </div>
    </AdminShell>
  );
}
