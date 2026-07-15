import Link from "next/link";
import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/features/admin/components/status-badge";
import { formatNetworkLabel } from "@/features/affiliate-import/network-labels";
import { AFFILIATE_NETWORKS, type AffiliateNetwork } from "@/features/affiliate-import/types";
import { archiveOfferAction, publishOfferAction } from "@/features/offers/actions";
import { formatDiscount, formatRedemptionType } from "@/features/offers/format";
import { findAdminOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Admin erbjudanden",
  description: "Hantera erbjudanden och ranking.",
  path: "/admin/erbjudanden",
});

function parseNetworkFilter(network: string | undefined) {
  return AFFILIATE_NETWORKS.includes(network as AffiliateNetwork)
    ? (network as AffiliateNetwork)
    : undefined;
}

function parseStatusFilter(status: string | undefined) {
  if (status === "published" || status === "draft" || status === "archived") {
    return status;
  }

  return undefined;
}

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string; status?: string; imported?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const networkFilter = parseNetworkFilter(params.network);
  const statusFilter = parseStatusFilter(params.status);
  const importedFilter =
    params.imported === "1" ? true : params.imported === "0" ? false : undefined;

  const offers = await findAdminOffers({
    network: networkFilter,
    status: statusFilter,
    imported: importedFilter,
  });

  const hasFilters = Boolean(networkFilter || statusFilter || importedFilter !== undefined);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Erbjudanden</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Lägre rankingvärde visas högre upp publikt.
              {hasFilters ? (
                <>
                  {" "}
                  Visar filtrerad lista
                  {networkFilter ? ` · ${formatNetworkLabel(networkFilter)}` : ""}
                  {statusFilter ? ` · ${statusFilter}` : ""}
                  {importedFilter === true ? " · importerade" : ""}
                  {importedFilter === false ? " · manuella" : ""}
                  .
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters ? (
              <Button variant="outline" asChild>
                <Link href="/admin/erbjudanden">Visa alla</Link>
              </Button>
            ) : null}
            {networkFilter ? (
              <Button variant="outline" asChild>
                <Link href="/admin/import">
                  <Download className="size-4" />
                  Gå till import
                </Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/admin/erbjudanden/new">
                <Plus className="size-4" />
                Nytt erbjudande
              </Link>
            </Button>
          </div>
        </div>

        {!hasFilters ? (
          <div className="flex flex-wrap gap-2">
            {AFFILIATE_NETWORKS.map((item) => (
              <Button key={item} variant="outline" size="sm" asChild>
                <Link href={`/admin/erbjudanden?network=${item}&imported=1&status=published`}>
                  {formatNetworkLabel(item)}
                </Link>
              </Button>
            ))}
          </div>
        ) : null}

        <Card className="rounded-lg shadow-none">
          <CardContent className="p-0">
            {offers.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm">
                <p className="font-medium">Inga erbjudanden matchar filtret</p>
                <p className="mt-2 text-muted-foreground">
                  {networkFilter
                    ? `Det finns inga publicerade importerade erbjudanden för ${formatNetworkLabel(networkFilter)} ännu.`
                    : "Prova att ändra filter eller skapa ett nytt erbjudande."}
                </p>
                {networkFilter ? (
                  <Button className="mt-4" variant="outline" asChild>
                    <Link href="/admin/import">Kör import för nätverket</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Butik</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Rabatt</TableHead>
                    <TableHead>Källa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ranking</TableHead>
                    <TableHead>Klick hemsida</TableHead>
                    <TableHead>Klick rabattkod</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.title}</TableCell>
                      <TableCell>{offer.store?.name ?? "-"}</TableCell>
                      <TableCell>{formatRedemptionType(offer.redemption_type)}</TableCell>
                      <TableCell>
                        {formatDiscount(offer.discount_type, offer.discount_value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNetworkLabel(offer.affiliate_network)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={offer.status} />
                      </TableCell>
                      <TableCell>{offer.rank_position}</TableCell>
                      <TableCell>{offer.website_click_count ?? 0}</TableCell>
                      <TableCell>{offer.code_click_count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/erbjudanden/${offer.id}`}>Redigera</Link>
                          </Button>
                          {offer.status !== "published" ? (
                            <form action={publishOfferAction.bind(null, offer.id)}>
                              <Button variant="secondary" size="sm" type="submit">
                                Publicera
                              </Button>
                            </form>
                          ) : (
                            <form action={archiveOfferAction.bind(null, offer.id)}>
                              <Button variant="secondary" size="sm" type="submit">
                                Arkivera
                              </Button>
                            </form>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
