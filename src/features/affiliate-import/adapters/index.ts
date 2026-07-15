import { addrevenueAdapter } from "./addrevenue";
import { adrecordAdapter } from "./adrecord";
import { adtractionAdapter } from "./adtraction";
import { awinAdapter } from "./awin";
import { tradedoublerAdapter } from "./tradedoubler";
import type { AffiliateAdapter, AffiliateNetwork } from "../types";

export const affiliateAdapters: AffiliateAdapter[] = [
  addrevenueAdapter,
  adtractionAdapter,
  adrecordAdapter,
  awinAdapter,
  tradedoublerAdapter,
];

const adapterMap = Object.fromEntries(
  affiliateAdapters.map((adapter) => [adapter.network, adapter]),
) as Record<AffiliateNetwork, AffiliateAdapter>;

export function getAdapterByNetwork(network: AffiliateNetwork) {
  return adapterMap[network] ?? null;
}

export function getConfiguredAdapters(networks?: AffiliateNetwork[]) {
  const selected = networks?.length
    ? networks.map((network) => adapterMap[network]).filter(Boolean)
    : affiliateAdapters;

  return selected.filter((adapter) => adapter.isConfigured());
}
