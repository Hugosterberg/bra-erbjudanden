import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { NetworkImportRunWithBatch } from "../queries";
import { formatNetworkLabel } from "../network-labels";
import { ImportStatusBadge } from "./import-status-badge";

type NetworkImportRunHistoryProps = {
  runs: NetworkImportRunWithBatch[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "–";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) {
    return "Pågår";
  }

  const seconds = Math.round(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );

  if (seconds < 60) {
    return `${seconds} s`;
  }

  return `${Math.round(seconds / 60)} min`;
}

export function NetworkImportRunHistory({ runs }: NetworkImportRunHistoryProps) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Import per nätverk</CardTitle>
        <p className="text-sm text-muted-foreground">
          Varje rad är en separat import från ett affiliatenätverk — enkelt att se exakt var det
          gick fel.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {runs.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Inga nätverksimporter har körts ännu.
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
                <TableHead>Varaktighet</TableHead>
                <TableHead>Fel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {formatNetworkLabel(run.affiliate_network)}
                  </TableCell>
                  <TableCell>{formatDate(run.started_at)}</TableCell>
                  <TableCell>
                    <ImportStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell data-numeric>{run.fetched}</TableCell>
                  <TableCell data-numeric>{run.created_count}</TableCell>
                  <TableCell data-numeric>{run.updated_count}</TableCell>
                  <TableCell data-numeric>{run.archived_count}</TableCell>
                  <TableCell>{formatDuration(run.started_at, run.finished_at)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {run.errors.length > 0 ? run.errors[0] : "–"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
