import { IMPORT_RUN_STALE_MINUTES } from "./constants";
import type { ImportBatchStatus } from "./types";

export function isStaleRunningImport(startedAt: string, finishedAt: string | null) {
  if (finishedAt) {
    return false;
  }

  const staleBefore = Date.now() - IMPORT_RUN_STALE_MINUTES * 60_000;
  return new Date(startedAt).getTime() < staleBefore;
}

export function normalizeDisplayImportStatus(
  status: string,
  startedAt: string,
  finishedAt: string | null,
): ImportBatchStatus {
  if (status === "running" && isStaleRunningImport(startedAt, finishedAt)) {
    return "stale";
  }

  if (
    status === "running" ||
    status === "completed" ||
    status === "completed_with_errors" ||
    status === "failed"
  ) {
    return status;
  }

  return "failed";
}

export function getStaleBeforeIso() {
  return new Date(Date.now() - IMPORT_RUN_STALE_MINUTES * 60_000).toISOString();
}
