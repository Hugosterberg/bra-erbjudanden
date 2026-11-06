import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { formatNetworkLabel } from "@/features/affiliate-import/network-labels";
import { syncTransactionsAction } from "@/features/revenue/actions";
import { calculateEpc } from "@/features/revenue/mappers";
import { TRANSACTION_CLIENTS } from "@/features/revenue/network-clients";
import {
  findLatestTransactionSyncRuns,
  findRecentTransactions,
  findRevenueSummary,
  type RevenueRow,
} from "@/features/revenue/queries";
import { daysAgo } from "@/features/tracking/discovery-events";
import { currentMarket } from "@/shared/config/market";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Intäkter",
  description: "Provision och intäkt per klick per nätverk, butik, erbjudande och sida.",
  path: "/admin/intakter",
});

const PERIOD_DAYS = 30;

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(currentMarket.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

const TRANSACTION_STATUS_LABELS = {
  pending: "Väntande",
  approved: "Godkänd",
  rejected: "Nekad",
  paid: "Utbetald",
} as const;

function RevenueTable({
  title,
  rows,
  label,
  formatLabel = (row) => row.dimension_label ?? "Okänd",
}: {
  title: string;
  rows: RevenueRow[];
  label: string;
  formatLabel?: (row: RevenueRow) => string;
}) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Ingen data för perioden.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{label}</TableHead>
                <TableHead className="text-right">Klick</TableHead>
                <TableHead className="text-right">Köp</TableHead>
                <TableHead className="text-right">Väntande</TableHead>
                <TableHead className="text-right">Godkänd</TableHead>
                <TableHead className="text-right">Per klick</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const epc = calculateEpc({
                  clicks: Number(row.clicks),
                  pendingCommission: Number(row.pending_commission),
                  approvedCommission: Number(row.approved_commission),
                });

                return (
                  <TableRow key={`${row.dimension_key}-${row.currency}`}>
                    <TableCell className="max-w-72 truncate font-medium">
                      {formatLabel(row)}
                    </TableCell>
                    <TableCell className="text-right">{Number(row.clicks)}</TableCell>
                    <TableCell className="text-right">{Number(row.transactions)}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(row.pending_commission), row.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(row.approved_commission), row.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {epc === null ? "–" : formatMoney(epc, row.currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminRevenuePage() {
  await requireAdmin();
  const since = daysAgo(PERIOD_DAYS);
  const [byNetwork, byStore, byOffer, byPage, syncRuns, recentTransactions] = await Promise.all([
    findRevenueSummary("network", since),
    findRevenueSummary("store", since),
    findRevenueSummary("offer", since),
    findRevenueSummary("page", since),
    findLatestTransactionSyncRuns(),
    findRecentTransactions(),
  ]);
  const totals = {
    // A network reporting in two currencies has two rows with the same clicks.
    clicks: [...new Map(byNetwork.map((row) => [row.dimension_key, Number(row.clicks)])).values()].reduce(
      (sum, clicks) => sum + clicks,
      0,
    ),
    transactions: byNetwork.reduce((sum, row) => sum + Number(row.transactions), 0),
  };
  const connected = TRANSACTION_CLIENTS.filter((client) => client.isConfigured());

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Intäkter</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              De senaste {PERIOD_DAYS} dagarna: {totals.clicks} klick till butiker och{" "}
              {totals.transactions} köp. Klick från botar och förhandsladdning räknas inte, men
              klick från före november 2026 kan innehålla sådana.
            </p>
          </div>
          <form action={syncTransactionsAction}>
            <Button type="submit" variant="outline" disabled={connected.length === 0}>
              Hämta provision nu
            </Button>
          </form>
        </div>

        <div className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          <p>
            Provision hämtas automatiskt från:{" "}
            {connected.length > 0
              ? connected.map((client) => formatNetworkLabel(client.network)).join(", ")
              : "inga nätverk ännu. Lägg till API-uppgifter för Awin, Adtraction eller Addrevenue."}
          </p>
          <p className="mt-1">
            Adrecord och Tradedoubler hämtas inte automatiskt. Deras provision ser du i respektive
            nätverks egen panel, men klicken räknas här.
          </p>
        </div>

        {syncRuns.some((run) => run.status === "failed") ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            {syncRuns
              .filter((run) => run.status === "failed")
              .slice(0, 3)
              .map((run) => (
                <p key={`${run.network}-${run.ran_at}`}>
                  {formatNetworkLabel(run.network)}: {run.error}
                </p>
              ))}
          </div>
        ) : null}

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Senaste köpen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Efter ett testköp ska köpet synas här med Ja under Klick-id. Står det Nej gick köpet
              inte att koppla till ett klick, och spårningen för nätverket behöver kontrolleras.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">Inga köp har hämtats ännu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Nätverk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Provision</TableHead>
                    <TableHead>Klick-id</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Intl.DateTimeFormat(currentMarket.locale, { dateStyle: "medium" }).format(
                          new Date(transaction.transaction_at),
                        )}
                      </TableCell>
                      <TableCell>{formatNetworkLabel(transaction.network)}</TableCell>
                      <TableCell>{TRANSACTION_STATUS_LABELS[transaction.status]}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(Number(transaction.commission), transaction.currency)}
                      </TableCell>
                      <TableCell>{transaction.click_id ? "Ja" : "Nej"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <RevenueTable
          title="Per nätverk"
          rows={byNetwork}
          label="Nätverk"
          formatLabel={(row) => (row.dimension_key ? formatNetworkLabel(row.dimension_key) : "Utan nätverk")}
        />
        <RevenueTable title="Per butik" rows={byStore} label="Butik" />
        <RevenueTable title="Per erbjudande" rows={byOffer} label="Erbjudande" />
        <RevenueTable title="Per sida som skickade klicket" rows={byPage} label="Sida" />
      </div>
    </AdminShell>
  );
}
