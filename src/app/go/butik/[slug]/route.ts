import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { findActiveStoreBySlug } from "@/features/stores/queries";
import { resolveStoreOutboundUrl } from "@/features/stores/outbound";
import { recordDiscoveryEvent } from "@/features/tracking/discovery-events";

type StoreRedirectProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, { params }: StoreRedirectProps) {
  const { slug } = await params;
  const store = await findActiveStoreBySlug(slug);
  const destination = store ? resolveStoreOutboundUrl(store) : null;

  if (!store || !destination) {
    redirect("/butiker");
  }

  await recordDiscoveryEvent({
    eventType: "affiliate_click",
    entityType: "store",
    entityId: store.id,
  });

  redirect(destination);
}
