import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { findOfferRedirectTarget } from "@/features/offers/queries";
import { recordAffiliateClick } from "@/features/tracking/record-click";

type GoRouteProps = {
  params: Promise<{ offerId: string }>;
};

export async function GET(_request: NextRequest, { params }: GoRouteProps) {
  const { offerId } = await params;
  const offer = await findOfferRedirectTarget(offerId);

  if (!offer) {
    redirect("/erbjudanden");
  }

  await recordAffiliateClick(offer);
  redirect(offer.affiliate_url);
}
