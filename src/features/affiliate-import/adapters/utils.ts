export class AffiliateApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AffiliateApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  options?: { timeoutMs?: number; retries?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...init?.headers,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const error = new AffiliateApiError(
          `API-anrop misslyckades (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
          response.status,
        );

        if (attempt < retries && error.status && RETRYABLE_STATUSES.has(error.status)) {
          lastError = error;
          await sleep(1_000 * (attempt + 1));
          continue;
        }

        throw error;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AffiliateApiError) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error("Nätverksanrop misslyckades");

      if (attempt < retries) {
        await sleep(1_000 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Nätverksanrop misslyckades");
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
