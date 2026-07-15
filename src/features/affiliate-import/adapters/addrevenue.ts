import { getAddrevenueConfig } from "../config";
import { ensureDescription, ensureTitle, parseDiscountFromText } from "../parse-discount";
import type { AffiliateAdapter, ImportedOfferDraft } from "../types";
import {
  dedupeByExternalId,
  fetchJson,
  isExpired,
  pickNumber,
  pickString,
  readArray,
  readRecord,
  toIsoDate,
} from "./utils";

type AddrevenueListResponse = {
  results?: unknown[];
};

type AdvertiserLookup = Map<
  string,
  {
    name: string;
    websiteUrl: string | null;
    logoUrl: string | null;
  }
>;

const BASE_URL = "https://addrevenue.io/api/v2";

async function fetchAdvertisers(
  apiToken: string,
  channelId: string,
): Promise<AdvertiserLookup> {
  const response = await fetchJson<AddrevenueListResponse>(
    `${BASE_URL}/advertisers?channelId=${encodeURIComponent(channelId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  );

  const lookup: AdvertiserLookup = new Map();

  for (const item of readArray(response.results)) {
    const record = readRecord(item);
    if (!record) {
      continue;
    }

    const id = pickString(record, ["id", "advertiserId"]);
    if (!id) {
      continue;
    }

    lookup.set(id, {
      name: pickString(record, ["name", "advertiserName", "brandName"]) || `Butik ${id}`,
      websiteUrl: pickString(record, ["url", "websiteUrl", "website"]) || null,
      logoUrl: pickString(record, ["logo", "logoUrl"]) || null,
    });
  }

  return lookup;
}

function mapCampaign(
  record: Record<string, unknown>,
  advertisers: AdvertiserLookup,
): ImportedOfferDraft | null {
  const externalId = pickString(record, ["id", "campaignId"]);
  const affiliateUrl = pickString(record, ["trackingLink", "trackingUrl", "url"]);
  const advertiserId = String(
    pickNumber(record, ["advertiserId", "advertiserID"]) ??
      pickString(record, ["advertiserId", "advertiserID"]) ??
      "",
  );

  if (!externalId || !affiliateUrl || !advertiserId) {
    return null;
  }

  const advertiser = advertisers.get(advertiserId);
  const title = ensureTitle(
    pickString(record, ["title", "name", "headline"]),
    pickString(record, ["description"]) || `${advertiser?.name ?? "Butik"} erbjudande`,
  );
  const description = ensureDescription(
    pickString(record, ["description", "text", "body"]),
    title,
  );
  const discountCode = pickString(record, ["discountCode", "code", "couponCode"]) || null;
  const discount = parseDiscountFromText(
    title,
    description,
    pickString(record, ["discount", "discountText"]),
  );
  const endsAt = toIsoDate(
    pickString(record, ["endDate", "endsAt", "stop", "validTo", "expiresAt"]),
  );

  if (isExpired(endsAt)) {
    return null;
  }

  return {
    externalId,
    network: "addrevenue",
    title,
    description,
    store: {
      externalId: advertiserId,
      name:
        advertiser?.name ??
        (pickString(record, ["advertiserName"]) || `Butik ${advertiserId}`),
      websiteUrl:
        advertiser?.websiteUrl ?? (pickString(record, ["advertiserUrl"]) || null),
      logoUrl: advertiser?.logoUrl ?? null,
    },
    redemptionType: discountCode ? "discount_code" : "direct_link",
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCode,
    affiliateUrl,
    terms: pickString(record, ["terms", "conditions"]) || null,
    imageUrl: pickString(record, ["imageUrl", "image", "bannerUrl"]) || null,
    startsAt: toIsoDate(
      pickString(record, ["startDate", "startsAt", "start", "validFrom"]),
    ),
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

    const advertisers = await fetchAdvertisers(config.apiToken, config.channelId);
    const response = await fetchJson<AddrevenueListResponse>(
      `${BASE_URL}/campaigns?channelId=${encodeURIComponent(config.channelId)}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
      },
    );

    const offers = readArray(response.results)
      .map((item) => {
        const record = readRecord(item);
        return record ? mapCampaign(record, advertisers) : null;
      })
      .filter((offer): offer is ImportedOfferDraft => offer !== null);

    return dedupeByExternalId(offers);
  },
};
