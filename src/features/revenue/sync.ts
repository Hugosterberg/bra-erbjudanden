import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { dedupeTransactions, type NormalizedTransaction } from "./mappers";
import { TRANSACTION_CLIENTS } from "./network-clients";

// Commission can be approved or rejected long after the sale.
const LOOKBACK_DAYS = 90;
const BATCH_SIZE = 200;

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function findClickOrigins(supabase: AdminClient, clickIds: string[]) {
  const origins = new Map<string, { offerId: string | null; storeId: string | null }>();

  for (const batch of chunk(clickIds, BATCH_SIZE)) {
    const { data } = await supabase
      .from("click_events")
      .select("click_id, offer_id, store_id")
      .in("click_id", batch);

    for (const row of data ?? []) {
      if (row.click_id) {
        origins.set(row.click_id, { offerId: row.offer_id, storeId: row.store_id });
      }
    }
  }

  return origins;
}

async function findProgramStores(supabase: AdminClient, network: NormalizedTransaction["network"]) {
  const { data } = await supabase
    .from("store_affiliate_programs")
    .select("external_id, store_id")
    .eq("network", network);

  return new Map((data ?? []).map((row) => [row.external_id, row.store_id]));
}

async function saveTransactions(supabase: AdminClient, fetched: NormalizedTransaction[]) {
  const transactions = dedupeTransactions(fetched);

  if (transactions.length === 0) {
    return;
  }

  const clickIds = transactions.flatMap((item) => (item.clickId ? [item.clickId] : []));
  const origins = await findClickOrigins(supabase, clickIds);
  const programStores = await findProgramStores(supabase, transactions[0].network);

  const rows = transactions.map((item) => {
    const origin = item.clickId ? origins.get(item.clickId) : undefined;
    return {
      network: item.network,
      external_id: item.externalId,
      program_external_id: item.programExternalId,
      click_ref: item.clickRef,
      // A reference with no stored click must not break the foreign-key-free
      // join, but it also tells us nothing, so it is only kept when it matches.
      click_id: origin ? item.clickId : null,
      offer_id: origin?.offerId ?? null,
      store_id:
        origin?.storeId ??
        (item.programExternalId ? (programStores.get(item.programExternalId) ?? null) : null),
      status: item.status,
      commission: item.commission,
      order_value: item.orderValue,
      currency: item.currency,
      transaction_at: item.transactionAt,
    };
  });

  for (const batch of chunk(rows, BATCH_SIZE)) {
    const { error } = await supabase
      .from("network_transactions")
      .upsert(batch, { onConflict: "network,external_id" });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function syncNetworkTransactions() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, results: [] as Array<{ network: string; fetched: number; error?: string }> };
  }

  const until = new Date();
  const since = new Date(until.getTime() - LOOKBACK_DAYS * 86_400_000);
  const results: Array<{ network: string; fetched: number; error?: string }> = [];

  for (const client of TRANSACTION_CLIENTS.filter((item) => item.isConfigured())) {
    try {
      const transactions = await client.fetchTransactions(since, until);
      await saveTransactions(supabase, transactions);
      await supabase.from("network_transaction_sync_runs").insert({
        network: client.network,
        status: "completed",
        fetched: transactions.length,
      });
      results.push({ network: client.network, fetched: transactions.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Okänt fel";
      console.error(`[revenue] Sync failed for ${client.network}`, message);
      await supabase.from("network_transaction_sync_runs").insert({
        network: client.network,
        status: "failed",
        error: message.slice(0, 500),
      });
      results.push({ network: client.network, fetched: 0, error: message });
    }
  }

  return { ok: results.every((result) => !result.error), results };
}
