import type { ImportBatchStatus } from "./queries";

const STATUS_LABELS: Record<ImportBatchStatus, string> = {
  running: "Körs",
  completed: "Klar",
  completed_with_errors: "Klar med fel",
  failed: "Misslyckades",
};

export function formatImportStatus(status: ImportBatchStatus | string) {
  return STATUS_LABELS[status as ImportBatchStatus] ?? status;
}

export function importStatusVariant(
  status: ImportBatchStatus | string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "completed_with_errors":
      return "outline";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}
