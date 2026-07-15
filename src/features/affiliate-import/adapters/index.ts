import { addrevenueAdapter } from "./addrevenue";
import { adrecordAdapter } from "./adrecord";
import { adtractionAdapter } from "./adtraction";
import { awinAdapter } from "./awin";
import { tradedoublerAdapter } from "./tradedoubler";
import type { AffiliateAdapter } from "../types";

export const affiliateAdapters: AffiliateAdapter[] = [
  addrevenueAdapter,
  adtractionAdapter,
  adrecordAdapter,
  awinAdapter,
  tradedoublerAdapter,
];

export function getConfiguredAdapters() {
  return affiliateAdapters.filter((adapter) => adapter.isConfigured());
}
