import { AFFILIATE_NETWORKS, type AffiliateNetwork } from "./types";
import { getNetworkProfile } from "./network-profiles";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function parseNetworkList(raw: string | null): AffiliateNetwork[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is AffiliateNetwork =>
      AFFILIATE_NETWORKS.includes(value as AffiliateNetwork),
    );
}

export function getCronSecret() {
  return readEnv("CRON_SECRET");
}

export function isNetworkConfigured(network: AffiliateNetwork) {
  switch (network) {
    case "addrevenue":
      return Boolean(readEnv("ADDREVENUE_API_TOKEN") && readEnv("ADDREVENUE_CHANNEL_ID"));
    case "adtraction":
      return Boolean(readEnv("ADTRACTION_API_TOKEN") && readEnv("ADTRACTION_CHANNEL_ID"));
    case "adrecord":
      return Boolean(readEnv("ADRECORD_API_KEY") && readEnv("ADRECORD_CHANNEL_ID"));
    case "awin":
      return Boolean(readEnv("AWIN_ACCESS_TOKEN") && readEnv("AWIN_PUBLISHER_ID"));
    case "tradedoubler":
      return Boolean(readEnv("TRADEDOUBLER_VOUCHERS_TOKEN"));
    default:
      return false;
  }
}

export function getCronSkippedNetworks() {
  return parseNetworkList(readEnv("AFFILIATE_IMPORT_CRON_SKIP"));
}

export function isNetworkSkippedInCron(network: AffiliateNetwork) {
  return getCronSkippedNetworks().includes(network);
}

export type NetworkImportProfile = {
  network: AffiliateNetwork;
  label: string;
  description: string;
  market: string;
  credentials: string[];
  configured: boolean;
  cronEnabled: boolean;
  publishedCount: number;
};

export function buildNetworkImportProfiles(publishedCounts: Record<string, number>) {
  const skipped = getCronSkippedNetworks();

  return AFFILIATE_NETWORKS.map((network) => {
    const profile = getNetworkProfile(network);
    const configured = isNetworkConfigured(network);

    return {
      network,
      label: profile.label,
      description: profile.description,
      market: profile.market,
      credentials: profile.credentials,
      configured,
      cronEnabled: configured && !skipped.includes(network),
      publishedCount: publishedCounts[network] ?? 0,
    };
  });
}

export function getAddrevenueConfig() {
  const apiToken = readEnv("ADDREVENUE_API_TOKEN");
  const channelId = readEnv("ADDREVENUE_CHANNEL_ID");

  if (!apiToken || !channelId) {
    return null;
  }

  return { apiToken, channelId };
}

export function getAdtractionConfig() {
  const apiToken = readEnv("ADTRACTION_API_TOKEN");
  const channelId = readEnv("ADTRACTION_CHANNEL_ID");

  if (!apiToken || !channelId) {
    return null;
  }

  return { apiToken, channelId: Number(channelId) };
}

export function getAdrecordConfig() {
  const apiKey = readEnv("ADRECORD_API_KEY");
  const channelId = readEnv("ADRECORD_CHANNEL_ID");

  if (!apiKey || !channelId) {
    return null;
  }

  return { apiKey, channelId: Number(channelId) };
}

export function getAwinConfig() {
  const accessToken = readEnv("AWIN_ACCESS_TOKEN");
  const publisherId = readEnv("AWIN_PUBLISHER_ID");
  const regionCode = readEnv("AWIN_REGION_CODE") ?? "SE";

  if (!accessToken || !publisherId) {
    return null;
  }

  return { accessToken, publisherId, regionCode };
}

export function getTradedoublerConfig() {
  const token = readEnv("TRADEDOUBLER_VOUCHERS_TOKEN");

  if (!token) {
    return null;
  }

  return { token };
}
