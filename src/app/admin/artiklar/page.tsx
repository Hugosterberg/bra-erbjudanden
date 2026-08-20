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
import { findAdminArticles } from "@/features/editorial/queries";
import { ARTICLE_TYPE_LABELS } from "@/features/editorial/types";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Artiklar",
  description: "Administrera Bäst i test, recensioner och guider.",
  path: "/admin/artiklar",
  index: false,
});

export default async function AdminArticlesPage() {
  await requireAdmin();
  const articles = await findAdminArticles();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Artiklar</h1>
          <Button asChild>
            <Link href="/admin/artiklar/new">
              <Plus className="size-4" />
              Ny artikel
            </Link>
          </Button>
        </div>
        <Card className="rounded-lg shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>{ARTICLE_TYPE_LABELS[article.article_type]}</TableCell>
                    <TableCell>
                      <StatusBadge status={article.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/artiklar/${article.id}`}>Redigera</Link>
                      </Button>
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
