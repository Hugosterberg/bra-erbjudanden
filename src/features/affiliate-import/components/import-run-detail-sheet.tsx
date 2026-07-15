"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  formatImportDateTime,
  formatImportDuration,
} from "../format-import-datetime";
import { formatNetworkLabel } from "../network-labels";
import type { NetworkImportRunWithBatch } from "../queries";
import { ImportStatusBadge } from "./import-status-badge";

type ImportRunDetailSheetProps = {
  run: NetworkImportRunWithBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold" data-numeric>
        {value}
      </p>
    </div>
  );
}

export function ImportRunDetailSheet({ run, open, onOpenChange }: ImportRunDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {run ? formatNetworkLabel(run.affiliate_network) : "Importdetaljer"}
          </SheetTitle>
          <SheetDescription>Detaljerad logg för nätverksimporten.</SheetDescription>
        </SheetHeader>

        {run ? (
          <div className="mt-6 space-y-6 px-4 pb-8">
            <div className="flex items-center gap-2">
              <ImportStatusBadge status={run.status} />
              <span className="text-sm text-muted-foreground">
                {formatImportDuration(run.started_at, run.finished_at)}
              </span>
            </div>

            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Startade</dt>
                <dd>{formatImportDateTime(run.started_at, { dateStyle: "full" })}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Avslutades</dt>
                <dd>{formatImportDateTime(run.finished_at, { dateStyle: "full" })}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Samlad körning</dt>
                <dd>{formatImportDateTime(run.batch_started_at, { dateStyle: "full" })}</dd>
              </div>
            </dl>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Hämtade" value={run.fetched} />
              <StatBlock label="Nya" value={run.created_count} />
              <StatBlock label="Uppdaterade" value={run.updated_count} />
              <StatBlock label="Arkiverade" value={run.archived_count} />
              <StatBlock label="Överhoppade" value={run.skipped_count} />
            </div>

            {run.errors.length > 0 ? (
              <div>
                <h4 className="mb-2 text-sm font-medium text-destructive">
                  Fel och varningar ({run.errors.length})
                </h4>
                <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  {run.errors.map((error, index) => (
                    <li key={`${index}-${error}`} className="text-destructive/90">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Inga fel rapporterades för den här körningen.
              </p>
            )}
          </div>
        ) : (
          <p className="px-4 py-8 text-sm text-muted-foreground">Ingen körning vald.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
