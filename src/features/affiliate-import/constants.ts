// Manual offers keep ranks 1–MANUAL_RANK_RESERVE; imported offers rank above that band.
export const MANUAL_RANK_RESERVE = 20;

// Ignore stale "running" rows older than this when checking for concurrent imports.
export const IMPORT_RUN_STALE_MINUTES = 45;

// Do not archive existing imports when a feed returns fewer items than this
// (guards against API errors returning empty/partial responses).
export const MIN_FEED_SIZE_FOR_ARCHIVE = 1;

// Delay between network API calls to respect rate limits (Adrecord: 30/30s).
export const NETWORK_SYNC_DELAY_MS = 2_000;

export const IMPORT_CRON_SCHEDULE = "0 1,13 * * *";

export const IMPORT_SCHEDULE_LABEL =
  "Två gånger per dygn: 02:00 och 14:00 svensk tid (vintertid).";
