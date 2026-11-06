import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

import { findOfferRedirectTarget } from "@/features/offers/queries";
import { offerOutboundInput, trackOutboundClick } from "@/features/tracking/record-click";
import { isPrefetchRequest } from "@/features/tracking/request-classification";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

type GoRouteProps = {
  params: Promise<{ offerId: string }>;
};

export async function GET(request: NextRequest, { params }: GoRouteProps) {
  // A prefetch is not a click and must never reach the network's tracker.
  if (isPrefetchRequest(request.method, request.headers)) {
    return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const { offerId } = await params;
  const offer = await findOfferRedirectTarget(offerId);

  if (!offer) {
    // The offer is gone or expired; send visitors straight to the live list.
    redirect("/erbjudanden");
  }

  const destination = trackOutboundClick({
    ...offerOutboundInput(offer),
    headers: request.headers,
  });

  return NextResponse.redirect(destination, { status: 302, headers: NO_STORE_HEADERS });
}
