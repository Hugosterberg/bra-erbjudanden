import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getStaleBeforeIso, normalizeDisplayImportStatus } from "./import-status-utils";
import type { AffiliateNetwork, ImportBatchStatus, ImportRunStats } from "./types";
import { AFFILIATE_NETWORKS } from "./types";

export type { ImportBatchStatus } from "./types";

export type ImportRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: ImportBatchStatus;
  networks: string[];
  stats: ImportRunStats | null;
  errors: string[];
};

export type NetworkImportRunRow = {
  id: string;
  batch_id: string;
  affiliate_network: AffiliateNetwork;
  started_at: string;
  finished_at: string | null;
  status: ImportBatchStatus;
  fetched: number;
  created_count: number;
  updated_count: number;
  archived_count: number;
  skipped_count: number;
  errors: string[];
};

export type NetworkImportRunWithBatch = NetworkImportRunRow & {
  batch_started_at: string;
  batch_status: ImportBatchStatus;
};

function mapImportRun(row: {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  networks: string[] | null;
  stats: unknown;
  errors: unknown;
}): ImportRunRow {
  const status = normalizeDisplayImportStatus(row.status, row.started_at, row.finished_at);

  return {
    id: row.id,
    started_at: row.started_at,
    finished_at: row.finished_at,
    status,
    networks: row.networks ?? [],
    stats: (row.stats as ImportRunStats | null) ?? null,
    errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
  };
}

function mapNetworkImportRun(row: {
  id: string;
  batch_id: string;
  affiliate_network: AffiliateNetwork;
  started_at: string;
  finished_at: string | null;
  status: string;
  fetched: number;
  created_count: number;
  updated_count: number;
  archived_count: number;
  skipped_count: number;
  errors: unknown;
}): NetworkImportRunRow {
  const status = normalizeDisplayImportStatus(row.status, row.started_at, row.finished_at);

  return {
    id: row.id,
    batch_id: row.batch_id,
    affiliate_network: row.affiliate_network,
    started_at: row.started_at,
    finished_at: row.finished_at,
    status,
    fetched: row.fetched,
    created_count: row.created_count,
    updated_count: row.updated_count,
    archived_count: row.archived_count,
    skipped_count: row.skipped_count,
    errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
  };
}

export async function findLatestImportRun() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapImportRun(data) : null;
}

export async function findRecentImportRuns(limit = 5) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .order("started_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapImportRun);
}

export async function findRecentNetworkImportRuns(limit = 20) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [] as NetworkImportRunWithBatch[];
  }

  const { data } = await supabase
    .from("affiliate_import_network_runs")
    .select(
      `
      id,
      batch_id,
      affiliate_network,
      started_at,
      finished_at,
      status,
      fetched,
      created_count,
      updated_count,
      archived_count,
      skipped_count,
      errors,
      batch:affiliate_import_runs!batch_id (
        started_at,
        status
      )
    `,
    )
    .order("started_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const batch = row.batch as { started_at: string; status: string } | null;
    const mapped = mapNetworkImportRun({
      id: row.id,
      batch_id: row.batch_id,
      affiliate_network: row.affiliate_network as AffiliateNetwork,
      started_at: row.started_at,
      finished_at: row.finished_at,
      status: row.status,
      fetched: row.fetched,
      created_count: row.created_count,
      updated_count: row.updated_count,
      archived_count: row.archived_count,
      skipped_count: row.skipped_count,
      errors: row.errors,
    });

    return {
      ...mapped,
      batch_started_at: batch?.started_at ?? mapped.started_at,
      batch_status: normalizeDisplayImportStatus(
        batch?.status ?? mapped.status,
        batch?.started_at ?? mapped.started_at,
        null,
      ),
    };
  });
}

export async function findLatestNetworkImportByNetwork() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {} as Partial<Record<AffiliateNetwork, NetworkImportRunRow>>;
  }

  const { data } = await supabase
    .from("affiliate_import_network_runs")
    .select(
      "id, batch_id, affiliate_network, started_at, finished_at, status, fetched, created_count, updated_count, archived_count, skipped_count, errors",
    )
    .in("affiliate_network", AFFILIATE_NETWORKS)
    .order("started_at", { ascending: false })
    .limit(AFFILIATE_NETWORKS.length * 3);

  const results: Partial<Record<AffiliateNetwork, NetworkImportRunRow>> = {};

  for (const row of data ?? []) {
    const network = row.affiliate_network as AffiliateNetwork;
    if (!results[network]) {
      results[network] = mapNetworkImportRun({
        ...row,
        affiliate_network: network,
      });
    }
  }

  return results;
}

export async function findRunningNetworkImports() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [] as AffiliateNetwork[];
  }

  const staleBefore = getStaleBeforeIso();

  const { data } = await supabase
    .from("affiliate_import_network_runs")
    .select("affiliate_network")
    .eq("status", "running")
    .gte("started_at", staleBefore);

  return (data ?? []).map((row) => row.affiliate_network as AffiliateNetwork);
}

export async function findActiveImportRun() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const staleBefore = getStaleBeforeIso();

  const { data: activeBatch } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .eq("status", "running")
    .gte("started_at", staleBefore)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeBatch) {
    return mapImportRun(activeBatch);
  }

  const { data: activeNetworkRun } = await supabase
    .from("affiliate_import_network_runs")
    .select("batch_id")
    .eq("status", "running")
    .gte("started_at", staleBefore)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeNetworkRun?.batch_id) {
    return null;
  }

  const { data: batch } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .eq("id", activeNetworkRun.batch_id)
    .maybeSingle();

  return batch ? mapImportRun(batch) : null;
}

export async function countImportedOffersByNetwork() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {} as Record<string, number>;
  }

  const counts: Record<string, number> = Object.fromEntries(
    AFFILIATE_NETWORKS.map((network) => [network, 0]),
  );

  const { data } = await supabase
    .from("offers")
    .select("affiliate_network")
    .eq("is_imported", true)
    .eq("status", "published")
    .in("affiliate_network", [...AFFILIATE_NETWORKS]);

  for (const row of data ?? []) {
    if (row.affiliate_network) {
      counts[row.affiliate_network] = (counts[row.affiliate_network] ?? 0) + 1;
    }
  }

  return counts;
}

export async function countManualOffers() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("is_imported", false)
    .neq("status", "archived");

  return count ?? 0;
}
