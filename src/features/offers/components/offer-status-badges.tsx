import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DealScoreBadge } from "@/features/deal-score/components/deal-score-badge";

import { resolveOfferCommercialLabel } from "../commercial-labels";
import { formatRedemptionType } from "../format";
import type { OfferWithRelations } from "../types";
import { isRecentlyVerified } from "../verification";
import { CommercialLabelBadge } from "./commercial-label-badge";
import { VerifiedBadge } from "./verified-badge";

export function OfferStatusBadges({
  offer,
  score,
}: {
  offer: OfferWithRelations;
  score?: number;
}) {
  const commercial = resolveOfferCommercialLabel(offer);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {offer.is_featured ? (
        <Badge className="gap-1">
          <Sparkles className="size-3" />
          Utvald
        </Badge>
      ) : null}
      {commercial ? <CommercialLabelBadge label={commercial} /> : null}
      <Badge variant="outline">{formatRedemptionType(offer.redemption_type)}</Badge>
      {offer.category ? <Badge variant="secondary">{offer.category.name}</Badge> : null}
      {isRecentlyVerified(offer.last_verified_at ?? offer.last_synced_at) ? (
        <VerifiedBadge />
      ) : null}
      {typeof score === "number" ? <DealScoreBadge score={score} /> : null}
    </div>
  );
}
