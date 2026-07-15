import type { AffiliateNetwork } from "./types";

export const NETWORK_LABELS: Record<AffiliateNetwork, string> = {
  addrevenue: "Addrevenue",
  adtraction: "Adtraction",
  adrecord: "Adrecord",
  awin: "Awin",
  tradedoubler: "Tradedoubler",
};

export function formatNetworkLabel(network: AffiliateNetwork | string | null) {
  if (!network) {
    return "Manuell";
  }

  return NETWORK_LABELS[network as AffiliateNetwork] ?? network;
}
