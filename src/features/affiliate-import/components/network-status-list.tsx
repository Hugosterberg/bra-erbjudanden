import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { isNetworkConfigured } from "../config";
import { formatNetworkLabel } from "../network-labels";
import type { NetworkImportRunRow } from "../queries";
import { AFFILIATE_NETWORKS } from "../types";
import { ImportStatusBadge } from "./import-status-badge";

type NetworkStatusListProps = {
  importedCounts: Record<string, number>;
  latestRuns: Partial<Record<string, NetworkImportRunRow>>;
};

function formatLastRun(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NetworkStatusList({ importedCounts, latestRuns }: NetworkStatusListProps) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Affiliatenätverk</CardTitle>
        <p className="text-sm text-muted-foreground">
          Status och senaste import per nätverk.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {AFFILIATE_NETWORKS.map((network) => {
          const configured = isNetworkConfigured(network);
          const latestRun = latestRuns[network];

          return (
            <div
              key={network}
              className="rounded-lg border px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{formatNetworkLabel(network)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {configured
                      ? `${importedCounts[network] ?? 0} publicerade importerade erbjudanden`
                      : "API-uppgifter saknas i miljövariabler"}
                  </p>
                </div>
                {configured ? (
                  latestRun ? (
                    <ImportStatusBadge status={latestRun.status} />
                  ) : (
                    <Badge variant="secondary">Ej körd</Badge>
                  )
                ) : (
                  <Badge variant="secondary">Ej konfigurerad</Badge>
                )}
              </div>
              {configured && latestRun ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Senast: {formatLastRun(latestRun.started_at)}</span>
                  <span data-numeric>{latestRun.fetched} hämtade</span>
                  <span data-numeric>{latestRun.created_count} nya</span>
                  {latestRun.errors.length > 0 ? (
                    <span className="text-destructive">{latestRun.errors[0]}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
