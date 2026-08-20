import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function VerifiedBadge() {
  return (
    <Badge variant="outline" className="gap-1">
      <BadgeCheck className="size-3" />
      Verifierad
    </Badge>
  );
}
