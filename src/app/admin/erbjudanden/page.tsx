import Link from "next/link";
import { Plus } from "lucide-react";

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
import { archiveOfferAction, publishOfferAction } from "@/features/offers/actions";
import { formatDiscount, formatRedemptionType } from "@/features/offers/format";
import { findAdminOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Admin erbjudanden",
  description: "Hantera erbjudanden och ranking.",
  path: "/admin/erbjudanden",
});

export default async function AdminOffersPage() {
  await requireAdmin();
  const offers = await findAdminOffers();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Erbjudanden</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Lägre rankingvärde visas högre upp publikt.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/erbjudanden/new">
              <Plus className="size-4" />
              Nytt erbjudande
            </Link>
          </Button>
        </div>
        <Card className="rounded-lg shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Butik</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Rabatt</TableHead>
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
                    <TableCell>{formatDiscount(offer.discount_type, offer.discount_value)}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
