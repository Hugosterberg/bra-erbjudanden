import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

import { resolveStoreOutboundUrl } from "@/features/stores/outbound";
import { findActiveStoreBySlug } from "@/features/stores/queries";
import { trackOutboundClick } from "@/features/tracking/record-click";
import { isPrefetchRequest } from "@/features/tracking/request-classification";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

type StoreRedirectProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, { params }: StoreRedirectProps) {
  if (isPrefetchRequest(request.method, request.headers)) {
    return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);
  const url = store ? resolveStoreOutboundUrl(store) : null;

  if (!store || !url) {
    redirect("/butiker");
  }

  const destination = trackOutboundClick({
    url,
    knownNetwork: null,
    offerId: null,
    storeId: store.id,
    entityType: "store",
    headers: request.headers,
  });

  return NextResponse.redirect(destination, { status: 302, headers: NO_STORE_HEADERS });
}
