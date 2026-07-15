import type { AffiliateNetwork } from "./types";

export type NetworkProfile = {
  network: AffiliateNetwork;
  label: string;
  description: string;
  market: string;
  credentials: string[];
};

export const NETWORK_PROFILES: Record<AffiliateNetwork, NetworkProfile> = {
  addrevenue: {
    network: "addrevenue",
    label: "Addrevenue",
    description: "Svenskt nätverk med kampanjer och rabattkoder. Bra som första integration.",
    market: "Sverige / Norden",
    credentials: ["ADDREVENUE_API_TOKEN", "ADDREVENUE_CHANNEL_ID"],
  },
  adtraction: {
    network: "adtraction",
    label: "Adtraction",
    description: "Störst i Norden. Kupongfeed och deeplinks via partner-API.",
    market: "Sverige / Norden",
    credentials: ["ADTRACTION_API_TOKEN", "ADTRACTION_CHANNEL_ID"],
  },
  adrecord: {
    network: "adrecord",
    label: "Adrecord",
    description: "Svenskt nätverk med kuponger och kampanjer via enkelt API.",
    market: "Sverige / Norden",
    credentials: ["ADRECORD_API_KEY", "ADRECORD_CHANNEL_ID"],
  },
  awin: {
    network: "awin",
    label: "Awin",
    description: "Internationellt nätverk med Zalando, Etsy m.fl. Promotions-API.",
    market: "Internationellt (SE-filter)",
    credentials: ["AWIN_ACCESS_TOKEN", "AWIN_PUBLISHER_ID", "AWIN_REGION_CODE"],
  },
  tradedoubler: {
    network: "tradedoubler",
    label: "Tradedoubler",
    description: "Vouchers-API med många svenska e-handlare.",
    market: "Sverige / Europa",
    credentials: ["TRADEDOUBLER_VOUCHERS_TOKEN"],
  },
};

export function getNetworkProfile(network: AffiliateNetwork) {
  return NETWORK_PROFILES[network];
}
