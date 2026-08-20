import { Badge } from "@/components/ui/badge";

import { COMMERCIAL_LABELS, type CommercialLabel } from "../commercial-labels";

export function CommercialLabelBadge({ label }: { label: CommercialLabel }) {
  return (
    <Badge variant={label === "sponsored" ? "outline" : "secondary"}>
      {COMMERCIAL_LABELS[label]}
    </Badge>
  );
}
