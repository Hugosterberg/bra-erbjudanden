import { Badge } from "@/components/ui/badge";

import { formatImportStatus, importStatusVariant } from "../format-import-status";
import type { ImportBatchStatus } from "../types";

type ImportStatusBadgeProps = {
  status: ImportBatchStatus | string;
};

export function ImportStatusBadge({ status }: ImportStatusBadgeProps) {
  return (
    <Badge variant={importStatusVariant(status)}>{formatImportStatus(status)}</Badge>
  );
}
