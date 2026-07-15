import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ImportRunRow } from "../queries";
import { formatNetworkLabel } from "../network-labels";

type ImportRunHistoryProps = {
  runs: ImportRunRow[];
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

export function ImportRunHistory({ runs }: ImportRunHistoryProps) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Senaste körningar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {runs.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Inga importer har körts ännu.
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
                <TableHead>Arkiverade</TableHead>
                <TableHead>Varaktighet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{formatDate(run.started_at)}</TableCell>
                  <TableCell className="capitalize">{run.status}</TableCell>
                  <TableCell>
                    {run.networks.map((network) => formatNetworkLabel(network)).join(", ") ||
                      "–"}
                  </TableCell>
                  <TableCell data-numeric>{run.stats?.totals.created ?? 0}</TableCell>
                  <TableCell data-numeric>{run.stats?.totals.updated ?? 0}</TableCell>
                  <TableCell data-numeric>{run.stats?.totals.archived ?? 0}</TableCell>
                  <TableCell>{formatDuration(run.started_at, run.finished_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
