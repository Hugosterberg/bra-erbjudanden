/**
 * Turns each network's transaction format into one shape. Pure so that it can
 * be tested against the documented responses. See docs/ai/decisions.md for how
 * far each network's format has been verified.
 */
import { parseClickReference } from "../tracking/click-reference.ts";

export type TransactionStatus = "pending" | "approved" | "rejected" | "paid";

export type NormalizedTransaction = {
  network: "awin" | "adtraction" | "addrevenue";
  externalId: string;
  programExternalId: string | null;
  clickRef: string | null;
  clickId: string | null;
  status: TransactionStatus;
  commission: number;
  orderValue: number | null;
  currency: string;
  transactionAt: string;
};

type Json = Record<string, unknown>;

function record(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function text(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  return typeof value === "number" ? String(value) : "";
}

function amount(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function date(value: unknown) {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function mapAwinTransaction(raw: Json): NormalizedTransaction | null {
  const externalId = text(raw.id);
  const transactionAt = date(raw.transactionDate);
  const commission = record(raw.commissionAmount);
  const sale = record(raw.saleAmount);

  if (!externalId || !transactionAt) {
    return null;
  }

  const statuses: Record<string, TransactionStatus> = {
    pending: "pending",
    approved: "approved",
    declined: "rejected",
    deleted: "rejected",
  };
  const clickRef = text(record(raw.clickRefs).clickRef) || null;

  return {
    network: "awin",
    externalId,
    programExternalId: text(raw.advertiserId) || null,
    clickRef,
    clickId: parseClickReference(clickRef),
    status: statuses[text(raw.commissionStatus)] ?? "pending",
    commission: amount(commission.amount) ?? 0,
    orderValue: amount(sale.amount),
    currency: text(commission.currency) || "SEK",
    transactionAt,
  };
}

export function mapAdtractionTransaction(raw: Json): NormalizedTransaction | null {
  const externalId = text(raw.uniqueId);
  const transactionAt = date(raw.transactionDate);

  if (!externalId || !transactionAt) {
    return null;
  }

  const click = record(raw.click);
  const clickRef = text(click.epi) || text(raw.epi) || null;
  const statuses: Record<string, TransactionStatus> = {
    "1": "approved",
    "2": "pending",
    "4": "pending",
    "5": "rejected",
  };
  const isPaid = amount(raw.paymentId) !== null && text(raw.transactionStatus) === "1";

  return {
    network: "adtraction",
    externalId,
    programExternalId: text(click.programId) || text(raw.programId) || null,
    clickRef,
    clickId: parseClickReference(clickRef),
    status: isPaid ? "paid" : (statuses[text(raw.transactionStatus)] ?? "pending"),
    commission: amount(raw.commission) ?? 0,
    orderValue: amount(raw.orderValue),
    currency: text(raw.currency) || "SEK",
    transactionAt,
  };
}

export function mapAddrevenueTransaction(raw: Json): NormalizedTransaction | null {
  const externalId = text(raw.id);
  const transactionAt = date(raw.date) ?? date(raw.created);

  if (!externalId || !transactionAt) {
    return null;
  }

  const statuses: Record<string, TransactionStatus> = {
    new: "pending",
    delayed: "pending",
    approved: "approved",
    denied: "rejected",
    paidOut: "paid",
  };
  const clickRef = text(raw.clickRef) || null;
  // Our own reference comes back in clickRef or among the sub-IDs, whichever
  // parameter the network turns out to use. Their clickId is their own value.
  const ownReference = parseClickReference(clickRef) ?? findReferenceIn(raw.subids);

  return {
    network: "addrevenue",
    externalId,
    programExternalId: text(raw.advertiserId) || null,
    clickRef,
    clickId: ownReference,
    status: statuses[text(raw.status)] ?? "pending",
    commission: amount(raw.commission) ?? 0,
    orderValue: amount(raw.eventValue),
    currency: text(raw.currency) || "SEK",
    transactionAt,
  };
}

function findReferenceIn(value: unknown) {
  const match = JSON.stringify(value ?? "").match(/\b[0-9a-f]{32}\b/i);
  return match ? parseClickReference(match[0]) : null;
}

/** Earnings per click, the number that shows which stores are worth effort. */
export function calculateEpc(input: {
  clicks: number;
  pendingCommission: number;
  approvedCommission: number;
}) {
  if (input.clicks <= 0) {
    return null;
  }

  return (input.pendingCommission + input.approvedCommission) / input.clicks;
}
