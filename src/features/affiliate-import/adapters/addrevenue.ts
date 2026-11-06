import { currentMarket } from "@/shared/config/market";

import { getAddrevenueConfig } from "../config";
import { ensureDescription, parseDiscountFromText, titleFromText } from "../parse-discount";
import type { AffiliateAdapter, ImportedOfferDraft } from "../types";
import {
  dedupeByExternalId,
  fetchJson,
  isExpired,
  pickId,
  pickString,
  readArray,
  readRecord,
  toIsoDate,
} from "./utils";

type AddrevenueListResponse = {
  results?: unknown[];
  meta?: { hasNextPage?: boolean };
};

type Advertiser = {
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
};

export type AddrevenueAdvertisers = Map<string, Advertiser>;

const BASE_URL = "https://addrevenue.io/api/v2";
const PAGE_SIZE = 200;
const MAX_PAGES = 50;

async function fetchAllPages(path: string, apiToken: string, channelId: string) {
  const items: unknown[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetchJson<AddrevenueListResponse>(
      `${BASE_URL}/${path}?channelId=${encodeURIComponent(channelId)}&limit=${PAGE_SIZE}&page=${page}`,
      { headers: { Authorization: `Bearer ${apiToken}` } },
    );

    items.push(...readArray(response.results));

    if (!response.meta?.hasNextPage) {
      break;
    }
  }

  return items;
}

export function mapAddrevenueCampaign(
  record: Record<string, unknown>,
  advertisers: AddrevenueAdvertisers,
): ImportedOfferDraft | null {
  const externalId = pickId(record, ["id"]);
  // Only present for advertisers with an approved relation to the channel.
  const affiliateUrl = pickString(record, ["trackingLink"]);
  const advertiserId = pickId(record, ["advertiserId"]);
  const markets = readArray(record.markets).map(String);
  const endsAt = toIsoDate(record.validTo);

  if (
    !externalId ||
    !affiliateUrl ||
    !advertiserId ||
    pickString(record, ["status"]) === "ended" ||
    (markets.length > 0 && !markets.includes(currentMarket.code)) ||
    isExpired(endsAt)
  ) {
    return null;
  }

  const advertiser = advertisers.get(advertiserId);
  const storeName =
    advertiser?.name ?? (pickString(record, ["advertiserName"]) || `Butik ${advertiserId}`);
  const text = pickString(record, ["description"]);
  const title = titleFromText(text, `${storeName} erbjudande`);
  const discountCode = pickString(record, ["discountCode"]) || null;

  return {
    externalId,
    network: "addrevenue",
    title,
    description: ensureDescription(text, title),
    store: {
      externalId: advertiserId,
      name: storeName,
      websiteUrl: advertiser?.websiteUrl ?? (pickString(record, ["advertiserUrl"]) || null),
      logoUrl: advertiser?.logoUrl ?? null,
      affiliateUrl,
    },
    redemptionType: discountCode ? "discount_code" : "direct_link",
    ...parseDiscountFromText(text),
    discountCode,
    affiliateUrl,
    terms: pickString(record, ["terms"]) || null,
    imageUrl: null,
    startsAt: toIsoDate(record.validFrom),
    endsAt,
  };
}

export const addrevenueAdapter: AffiliateAdapter = {
  network: "addrevenue",
  isConfigured() {
    return Boolean(getAddrevenueConfig());
  },
  async fetchOffers() {
    const config = getAddrevenueConfig();
    if (!config) {
      return [];
    }

    const advertisers: AddrevenueAdvertisers = new Map();
    for (const item of await fetchAllPages("advertisers", config.apiToken, config.channelId)) {
      const record = readRecord(item);
      const id = record ? pickId(record, ["id"]) : "";
      if (record && id) {
        advertisers.set(id, {
          name: pickString(record, ["displayName", "name"]) || `Butik ${id}`,
          websiteUrl: pickString(record, ["url"]) || null,
          logoUrl: pickString(record, ["logoImageFilename"]) || null,
        });
      }
    }

    const campaigns = await fetchAllPages("campaigns", config.apiToken, config.channelId);
    const offers = campaigns
      .map((item) => {
        const record = readRecord(item);
        return record ? mapAddrevenueCampaign(record, advertisers) : null;
      })
      .filter((offer): offer is ImportedOfferDraft => offer !== null);

    return dedupeByExternalId(offers);
  },
};
