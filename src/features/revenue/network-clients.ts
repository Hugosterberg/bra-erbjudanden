import {
  getAddrevenueConfig,
  getAdtractionConfig,
  getAwinConfig,
} from "@/features/affiliate-import/config";
import { fetchJson, readArray, readRecord } from "@/features/affiliate-import/adapters/utils";
import type { AffiliateNetwork } from "@/features/affiliate-import/types";

import {
  mapAddrevenueTransaction,
  mapAdtractionTransaction,
  mapAwinTransaction,
  type NormalizedTransaction,
} from "./mappers";

type TransactionClient = {
  network: AffiliateNetwork;
  isConfigured: () => boolean;
  fetchTransactions: (since: Date, until: Date) => Promise<NormalizedTransaction[]>;
};

const AWIN_MAX_RANGE_DAYS = 31;
const DAY_MS = 86_400_000;
const ADDREVENUE_PAGE_SIZE = 200;
const ADDREVENUE_MAX_PAGES = 50;
// Asks for every status, so rejected and approved updates are also picked up.
const ADTRACTION_ALL_STATUSES = 0;

function mapAll(
  items: unknown[],
  mapper: (raw: Record<string, unknown>) => NormalizedTransaction | null,
) {
  return items
    .map((item) => {
      const raw = readRecord(item);
      return raw ? mapper(raw) : null;
    })
    .filter((item): item is NormalizedTransaction => item !== null);
}

function awinDate(date: Date) {
  return encodeURIComponent(date.toISOString().slice(0, 19));
}

const awinClient: TransactionClient = {
  network: "awin",
  isConfigured: () => Boolean(getAwinConfig()),
  async fetchTransactions(since, until) {
    const config = getAwinConfig();
    if (!config) {
      return [];
    }

    const transactions: NormalizedTransaction[] = [];

    for (let start = since.getTime(); start < until.getTime(); start += AWIN_MAX_RANGE_DAYS * DAY_MS) {
      const end = Math.min(start + AWIN_MAX_RANGE_DAYS * DAY_MS, until.getTime());
      const response = await fetchJson<unknown>(
        `https://api.awin.com/publishers/${config.publisherId}/transactions/?startDate=${awinDate(new Date(start))}&endDate=${awinDate(new Date(end))}&timezone=UTC`,
        { headers: { Authorization: `Bearer ${config.accessToken}` } },
      );
      transactions.push(...mapAll(readArray(response), mapAwinTransaction));
    }

    return transactions;
  },
};

const adtractionClient: TransactionClient = {
  network: "adtraction",
  isConfigured: () => Boolean(getAdtractionConfig()),
  async fetchTransactions(since, until) {
    const config = getAdtractionConfig();
    if (!config) {
      return [];
    }

    const response = await fetchJson<unknown>(
      "https://api.adtraction.net/v2/partner/transactions/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Token": config.apiToken },
        body: JSON.stringify({
          fromDate: since.toISOString(),
          toDate: until.toISOString(),
          transactionStatus: ADTRACTION_ALL_STATUSES,
          channelId: config.channelId,
        }),
      },
    );

    return mapAll(readArray(response), mapAdtractionTransaction);
  },
};

const addrevenueClient: TransactionClient = {
  network: "addrevenue",
  isConfigured: () => Boolean(getAddrevenueConfig()),
  async fetchTransactions(since) {
    const config = getAddrevenueConfig();
    if (!config) {
      return [];
    }

    const transactions: NormalizedTransaction[] = [];
    const fromDate = since.toISOString().slice(0, 10);

    for (let page = 1; page <= ADDREVENUE_MAX_PAGES; page += 1) {
      const response = await fetchJson<{ results?: unknown[]; meta?: { hasNextPage?: boolean } }>(
        `https://addrevenue.io/api/v2/transactions?channelId=${encodeURIComponent(config.channelId)}&updatedFromDate=${fromDate}&limit=${ADDREVENUE_PAGE_SIZE}&page=${page}`,
        { headers: { Authorization: `Bearer ${config.apiToken}` } },
      );

      transactions.push(...mapAll(readArray(response.results), mapAddrevenueTransaction));

      if (!response.meta?.hasNextPage) {
        break;
      }
    }

    return transactions;
  },
};

/**
 * Adrecord and Tradedoubler are missing on purpose: their transaction formats
 * could not be verified against documentation, and a guessed mapping could show
 * wrong money. Commission for them is read in each network's own dashboard.
 */
export const TRANSACTION_CLIENTS = [awinClient, adtractionClient, addrevenueClient];
