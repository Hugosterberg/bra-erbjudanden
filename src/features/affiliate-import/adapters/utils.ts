export class AffiliateApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AffiliateApiError";
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AffiliateApiError(
      `Request failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = readNumber(record[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export function toIsoDate(value: unknown) {
  const text = readString(value);
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isExpired(endDate: string | null | undefined) {
  if (!endDate) {
    return false;
  }

  return new Date(endDate).getTime() < Date.now();
}

export function dedupeByExternalId<T extends { externalId: string }>(items: T[]) {
  const map = new Map<string, T>();

  for (const item of items) {
    map.set(item.externalId, item);
  }

  return [...map.values()];
}
