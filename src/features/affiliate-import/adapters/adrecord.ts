import { getAdrecordConfig } from "../config";
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

const BASE_URL = "https://api.v2.adrecord.com";

type ProgramLookup = Map<
  string,
  {
    name: string;
    websiteUrl: string | null;
    logoUrl: string | null;
  }
>;

async function fetchPrograms(apiKey: string): Promise<ProgramLookup> {
  const response = await fetchJson<unknown[]>(`${BASE_URL}/programs?market=se`, {
    headers: {
      APIKEY: apiKey,
    },
  });

  const lookup: ProgramLookup = new Map();

  for (const item of readArray(response)) {
    const record = readRecord(item);
    if (!record) {
      continue;
    }

    const id = String(pickNumber(record, ["id"]) ?? "");
    if (!id) {
      continue;
    }

    lookup.set(id, {
      name: pickString(record, ["name"]) || `Program ${id}`,
      websiteUrl: pickString(record, ["url"]) || null,
      logoUrl: pickString(record, ["logo"]) || null,
    });
  }

  return lookup;
}

function readProgram(record: Record<string, unknown>) {
  const program = readRecord(record.program);
  const programId = String(
    pickNumber(program ?? {}, ["id"]) ?? pickNumber(record, ["programId"]) ?? "",
  );
  const programName =
    pickString(program ?? {}, ["name"]) || pickString(record, ["programName"]) || `Program ${programId}`;

  return { programId, programName };
}

function mapCouponOrCampaign(
  record: Record<string, unknown>,
  programs: ProgramLookup,
  hasCode: boolean,
): ImportedOfferDraft | null {
  const externalId = String(pickNumber(record, ["id"]) ?? pickString(record, ["id"]));
  const affiliateUrl = pickString(record, ["trackingUrl", "url"]);
  const { programId, programName } = readProgram(record);

  if (!externalId || !affiliateUrl || !programId) {
    return null;
  }

  const program = programs.get(programId);
  const title = ensureTitle(
    pickString(record, ["title", "name"]),
    hasCode
      ? `${programName} rabattkod`
      : `${programName} kampanj`,
  );
  const description = ensureDescription(
    pickString(record, ["description", "affiliateDescription"]),
    title,
  );
  const discountCode = hasCode ? pickString(record, ["code"]) || null : null;
  const discount = parseDiscountFromText(title, description);
  const endsAt = toIsoDate(pickString(record, ["stop", "end", "validTo"]));

  if (isExpired(endsAt)) {
    return null;
  }

  return {
    externalId: hasCode ? `coupon-${externalId}` : `campaign-${externalId}`,
    network: "adrecord",
    title,
    description,
    store: {
      externalId: programId,
      name: program?.name ?? programName,
      websiteUrl:
        program?.websiteUrl ?? (pickString(record, ["url"]) || null),
      logoUrl: program?.logoUrl ?? null,
    },
    redemptionType: discountCode ? "discount_code" : "direct_link",
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCode,
    affiliateUrl,
    terms: null,
    imageUrl: program?.logoUrl ?? null,
    startsAt: toIsoDate(pickString(record, ["start", "validFrom"])),
    endsAt,
  };
}

async function fetchCouponsAndCampaigns(
  apiKey: string,
  channelId: number,
): Promise<ImportedOfferDraft[]> {
  const headers = { APIKEY: apiKey };
  const query = `?channel=${channelId}&market=se`;

  const [coupons, campaigns] = await Promise.all([
    fetchJson<unknown[]>(`${BASE_URL}/coupons${query}`, { headers }),
    fetchJson<unknown[]>(`${BASE_URL}/campaigns${query}`, { headers }),
  ]);

  const programs = await fetchPrograms(apiKey);
  const offers: ImportedOfferDraft[] = [];

  for (const item of readArray(coupons)) {
    const record = readRecord(item);
    if (!record) {
      continue;
    }

    const mapped = mapCouponOrCampaign(record, programs, true);
    if (mapped) {
      offers.push(mapped);
    }
  }

  for (const item of readArray(campaigns)) {
    const record = readRecord(item);
    if (!record) {
      continue;
    }

    const mapped = mapCouponOrCampaign(record, programs, false);
    if (mapped) {
      offers.push(mapped);
    }
  }

  return dedupeByExternalId(offers);
}

export const adrecordAdapter: AffiliateAdapter = {
  network: "adrecord",
  isConfigured() {
    return Boolean(getAdrecordConfig());
  },
  async fetchOffers() {
    const config = getAdrecordConfig();
    if (!config) {
      return [];
    }

    return fetchCouponsAndCampaigns(config.apiKey, config.channelId);
  },
};
