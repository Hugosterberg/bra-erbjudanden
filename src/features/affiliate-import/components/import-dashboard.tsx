"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, ChevronRight, Clock, Info, Layers, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ImportActionState } from "../actions";
import type { NetworkImportProfile } from "../config";
import { IMPORT_SCHEDULE_LABEL } from "../constants";
import {
  formatErrorPreview,
  formatImportDateTime,
  formatImportDuration,
} from "../format-import-datetime";
import { formatNetworkLabel } from "../network-labels";
import type {
  ImportRunRow,
  NetworkImportRunRow,
  NetworkImportRunWithBatch,
} from "../queries";
import type { AffiliateNetwork } from "../types";
import { AFFILIATE_NETWORKS } from "../types";
import { ImportAllButton } from "./import-all-button";
import { ImportFeedback } from "./import-feedback";
import { ImportRunDetailSheet } from "./import-run-detail-sheet";
import { ImportStatusBadge } from "./import-status-badge";
import { NetworkControlGrid } from "./network-control-grid";
import { NetworkSetupGuides } from "./network-setup-guides";

type ImportDashboardProps = {
  profiles: NetworkImportProfile[];
  latestRun: ImportRunRow | null;
  activeRun: ImportRunRow | null;
  runningNetworks: AffiliateNetwork[];
  latestNetworkRuns: Partial<Record<AffiliateNetwork, NetworkImportRunRow>>;
  networkRuns: NetworkImportRunWithBatch[];
  batchRuns: ImportRunRow[];
  initialTab?: "networks" | "history" | "guides" | "info";
  initialGuideNetwork?: AffiliateNetwork;
  stats: {
    configuredCount: number;
    importedTotal: number;
    manualCount: number;
    cronSkipped: AffiliateNetwork[];
  };
};

type FeedbackState = ImportActionState | null;

export function ImportDashboard({
  profiles,
  latestRun,
  activeRun,
  runningNetworks,
  latestNetworkRuns,
  networkRuns,
  batchRuns,
  initialTab = "networks",
  initialGuideNetwork,
  stats,
}: ImportDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [networkFilter, setNetworkFilter] = useState<AffiliateNetwork | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "failed" | "errors">("all");
  const [selectedRun, setSelectedRun] = useState<NetworkImportRunWithBatch | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isImportRunning = Boolean(activeRun);

  useEffect(() => {
    if (!isImportRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [isImportRunning, router]);

  const failedRuns = useMemo(
    () =>
      networkRuns
        .filter((run) => run.status === "failed" || run.status === "stale")
        .slice(0, 5),
    [networkRuns],
  );

  const filteredNetworkRuns = useMemo(() => {
    return networkRuns.filter((run) => {
      if (networkFilter !== "all" && run.affiliate_network !== networkFilter) {
        return false;
      }

      if (statusFilter === "failed" && run.status !== "failed" && run.status !== "stale") {
        return false;
      }

      if (
        statusFilter === "errors" &&
        run.status !== "failed" &&
        run.status !== "stale" &&
        run.status !== "completed_with_errors"
      ) {
        return false;
      }

      return true;
    });
  }, [networkRuns, networkFilter, statusFilter]);

  function handleResult(result: ImportActionState) {
    setFeedback(result);
  }

  function openRunDetail(run: NetworkImportRunWithBatch) {
    setSelectedRun(run);
    setSheetOpen(true);
  }

  function handleRunRowKeyDown(
    event: React.KeyboardEvent<HTMLTableRowElement>,
    run: NetworkImportRunWithBatch,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRunDetail(run);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate-import</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Full kontroll per nätverk — kör enskilt eller alla samtidigt. Varje körning loggas
            separat med status, statistik och felmeddelanden. {IMPORT_SCHEDULE_LABEL}
          </p>
        </div>
        <ImportAllButton
          disabled={isImportRunning}
          networkCount={stats.configuredCount}
          onResult={handleResult}
        />
      </div>

      <ImportFeedback
        message={feedback?.message ?? null}
        ok={feedback?.ok ?? null}
        warning={feedback?.warning}
        errors={feedback?.errors}
        onDismiss={() => setFeedback(null)}
      />

      {isImportRunning ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm"
        >
          <Clock className="mt-0.5 size-4 shrink-0 animate-pulse text-sky-600" />
          <div>
            <p className="font-medium">Import pågår</p>
            <p className="mt-1 text-muted-foreground">
              Startade {formatImportDateTime(activeRun?.started_at ?? null)}. Sidan uppdateras
              automatiskt.
            </p>
            {runningNetworks.length > 0 ? (
              <p className="mt-2 text-muted-foreground">
                Importerar just nu:{" "}
                {runningNetworks.map(formatNetworkLabel).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Aktiva nätverk", value: stats.configuredCount },
          { label: "Importerade erbjudanden", value: stats.importedTotal },
          { label: "Manuella erbjudanden", value: stats.manualCount },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold" data-numeric>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Senaste körning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestRun ? (
              <>
                <p className="text-sm font-medium">
                  {formatImportDateTime(latestRun.started_at)}
                </p>
                <ImportStatusBadge status={latestRun.status} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen körning ännu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {failedRuns.length > 0 ? (
        <Card className="rounded-2xl border-destructive/30 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" />
              Senaste misslyckade importer
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {failedRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => openRunDetail(run)}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{formatNetworkLabel(run.affiliate_network)}</p>
                  <p className="text-muted-foreground">
                    {formatErrorPreview(run.errors) === "–"
                      ? "Okänt fel"
                      : formatErrorPreview(run.errors)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="networks">
            <Network className="size-4" />
            Nätverk
          </TabsTrigger>
          <TabsTrigger value="history">
            <Layers className="size-4" />
            Historik
          </TabsTrigger>
          <TabsTrigger value="guides">
            <BookOpen className="size-4" />
            Guider
          </TabsTrigger>
          <TabsTrigger value="info">
            <Info className="size-4" />
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          <NetworkControlGrid
            profiles={profiles}
            latestRuns={latestNetworkRuns}
            runningNetworks={runningNetworks}
            importRunning={isImportRunning}
            onOpenGuide={(network) => {
              setActiveTab("guides");
              router.replace(`/admin/import?tab=guides&guide=${network}`, { scroll: false });
            }}
            onResult={handleResult}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
            <CardHeader>
              <CardTitle className="text-base">Filter</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={networkFilter === "all" ? "default" : "outline"}
                aria-pressed={networkFilter === "all"}
                onClick={() => setNetworkFilter("all")}
              >
                Alla nätverk
              </Button>
              {AFFILIATE_NETWORKS.map((network) => (
                <Button
                  key={network}
                  type="button"
                  size="sm"
                  variant={networkFilter === network ? "default" : "outline"}
                  aria-pressed={networkFilter === network}
                  onClick={() => setNetworkFilter(network)}
                >
                  {formatNetworkLabel(network)}
                </Button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-border sm:inline" />
              {(
                [
                  ["all", "Alla status"],
                  ["errors", "Med fel"],
                  ["failed", "Misslyckade"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={statusFilter === value ? "secondary" : "ghost"}
                  aria-pressed={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
            <CardHeader>
              <CardTitle className="text-base">Import per nätverk</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klicka på en rad för fullständig logg och alla felmeddelanden.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {filteredNetworkRuns.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  Inga körningar matchar filtret.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nätverk</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hämtade</TableHead>
                      <TableHead>Nya</TableHead>
                      <TableHead>Uppdaterade</TableHead>
                      <TableHead>Arkiverade</TableHead>
                      <TableHead>Överhoppade</TableHead>
                      <TableHead>Varaktighet</TableHead>
                      <TableHead>Fel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNetworkRuns.map((run) => (
                      <TableRow
                        key={run.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Visa detaljer för ${formatNetworkLabel(run.affiliate_network)}`}
                        className="cursor-pointer"
                        onClick={() => openRunDetail(run)}
                        onKeyDown={(event) => handleRunRowKeyDown(event, run)}
                      >
                        <TableCell className="font-medium">
                          {formatNetworkLabel(run.affiliate_network)}
                        </TableCell>
                        <TableCell>{formatImportDateTime(run.started_at)}</TableCell>
                        <TableCell>
                          <ImportStatusBadge status={run.status} />
                        </TableCell>
                        <TableCell data-numeric>{run.fetched}</TableCell>
                        <TableCell data-numeric>{run.created_count}</TableCell>
                        <TableCell data-numeric>{run.updated_count}</TableCell>
                        <TableCell data-numeric>{run.archived_count}</TableCell>
                        <TableCell data-numeric>{run.skipped_count}</TableCell>
                        <TableCell>{formatImportDuration(run.started_at, run.finished_at)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {formatErrorPreview(run.errors)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
            <CardHeader>
              <CardTitle className="text-base">Samlade körningar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Schemalagda eller manuella körningar som triggar flera nätverk i följd.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {batchRuns.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  Inga samlade körningar har loggats ännu.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nätverk</TableHead>
                      <TableHead>Nya</TableHead>
                      <TableHead>Uppdaterade</TableHead>
                      <TableHead>Varaktighet</TableHead>
                      <TableHead>Fel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{formatImportDateTime(run.started_at)}</TableCell>
                        <TableCell>
                          <ImportStatusBadge status={run.status} />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {run.networks.map((network) => (
                              <Badge key={network} variant="outline" className="text-xs">
                                {formatNetworkLabel(network)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell data-numeric>{run.stats?.totals.created ?? 0}</TableCell>
                        <TableCell data-numeric>{run.stats?.totals.updated ?? 0}</TableCell>
                        <TableCell>{formatImportDuration(run.started_at, run.finished_at)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {formatErrorPreview(run.errors)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <NetworkSetupGuides profiles={profiles} initialNetwork={initialGuideNetwork} />
        </TabsContent>

        <TabsContent value="info">
          <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
            <CardHeader>
              <CardTitle className="text-base">Så fungerar importen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Varje körning skapar en samlad logg. Inom körningen behandlas varje nätverk
                separat med egen status och felmeddelanden — så ett nätverks fel stoppar inte de
                andra.
              </p>
              <p>
                Utgångna erbjudanden arkiveras per nätverk, men bara när just det nätverkets feed
                svarar korrekt. Tomma svar arkiverar aldrig befintliga erbjudanden.
              </p>
              <p>
                Manuellt skapade erbjudanden behåller ranking 1–20. Importerade rankas från 21
                efter rabattstorlek inom respektive nätverk.
              </p>
              {stats.cronSkipped.length > 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <p className="font-medium text-foreground">Hoppas över i schemalagd import</p>
                  <p className="mt-1">
                    {stats.cronSkipped.map(formatNetworkLabel).join(", ")} — kan fortfarande köras
                    manuellt härifrån.
                  </p>
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Detaljerade setup-guider med inloggning, API-nycklar och steg-för-steg finns under
                fliken <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setActiveTab("guides")}>Guider</button>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportRunDetailSheet run={selectedRun} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
