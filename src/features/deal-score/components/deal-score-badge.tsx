import { Flame } from "lucide-react";

import { formatDealScoreLabel } from "../score";

export function DealScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      <Flame className="size-3.5" />
      {formatDealScoreLabel(score)}
    </span>
  );
}
