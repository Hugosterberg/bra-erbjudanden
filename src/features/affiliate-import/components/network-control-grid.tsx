"use client";

import Link from "next/link";
import { BookOpen, Clock3, ExternalLink, Globe2, KeyRound, Loader2, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ImportActionState } from "../actions";
import type { NetworkImportProfile } from "../config";
import { formatErrorPreview, formatImportDateTime } from "../format-import-datetime";
import type { NetworkImportRunRow } from "../queries";
import type { AffiliateNetwork } from "../types";
import { ImportStatusBadge } from "./import-status-badge";
import { NetworkImportButton } from "./network-import-button";

type NetworkControlGridProps = {
  profiles: NetworkImportProfile[];
  latestRuns: Partial<Record<AffiliateNetwork, NetworkImportRunRow>>;
  runningNetworks?: AffiliateNetwork[];
  importRunning?: boolean;
  onOpenGuide?: (network: AffiliateNetwork) => void;
  onResult: (result: ImportActionState) => void;
};

function statusAccent(status: string | undefined, isRunning: boolean) {
  if (isRunning) {
    return "border-l-sky-500";
  }

  switch (status) {
    case "completed":
      return "border-l-primary";
    case "completed_with_errors":
      return "border-l-amber-500";
    case "failed":
    case "stale":
      return "border-l-destructive";
    case "running":
      return "border-l-sky-500";
    default:
      return "border-l-muted-foreground/30";
  }
}

export function NetworkControlGrid({
  profiles,
  latestRuns,
  runningNetworks = [],
  importRunning = false,
  onOpenGuide,
  onResult,
}: NetworkControlGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {profiles.map((profile) => {
        const latestRun = latestRuns[profile.network];
        const isNetworkRunning = runningNetworks.includes(profile.network);

        return (
          <article
            key={profile.network}
            className={cn(
              "flex flex-col rounded-2xl border border-foreground/10 bg-card p-5 shadow-none ring-1 ring-foreground/5 border-l-4",
              statusAccent(latestRun?.status, isNetworkRunning),
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{profile.label}</h3>
                  {isNetworkRunning ? (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Importerar
                    </Badge>
                  ) : null}
                  {!profile.configured ? (
                    <Badge variant="secondary">Ej konfigurerad</Badge>
                  ) : profile.cronEnabled ? (
                    <Badge variant="outline">Schemalagd</Badge>
                  ) : (
                    <Badge variant="outline">Endast manuell</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
              {latestRun && !isNetworkRunning ? (
                <ImportStatusBadge status={latestRun.status} />
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  Publicerade
                </p>
                <p className="mt-1 text-lg font-semibold" data-numeric>
                  {profile.publishedCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe2 className="size-3.5" />
                  Marknad
                </p>
                <p className="mt-1 text-sm font-medium">{profile.market}</p>
              </div>
            </div>

            {latestRun ? (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  Senast {formatImportDateTime(latestRun.started_at)}
                </span>
                <span data-numeric>{latestRun.fetched} hämtade</span>
                <span data-numeric>{latestRun.created_count} nya</span>
                {latestRun.errors.length > 0 ? (
                  <span className="text-destructive">{formatErrorPreview(latestRun.errors, 60)}</span>
                ) : null}
              </div>
            ) : null}

            {!profile.configured ? (
              <div className="mt-4 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <KeyRound className="size-3.5" />
                  Saknade miljövariabler
                </p>
                <p>{profile.credentials.join(", ")}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <NetworkImportButton
                  network={profile.network}
                  configured={profile.configured}
                  disabled={importRunning}
                  onResult={onResult}
                />
                {profile.publishedCount > 0 ? (
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link
                      href={`/admin/erbjudanden?network=${profile.network}&imported=1&status=published`}
                    >
                      <ExternalLink className="size-4" />
                      Visa erbjudanden
                    </Link>
                  </Button>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit px-0 text-muted-foreground hover:text-foreground"
                onClick={() => onOpenGuide?.(profile.network)}
              >
                <BookOpen className="size-4" />
                Setup-guide för {profile.label}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
