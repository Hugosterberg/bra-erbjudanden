import { Badge } from "@/components/ui/badge";
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
import { findAdminSubscribers } from "@/features/subscribers/queries";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Admin prenumeranter",
  description: "Hantera listan över personer som vill ha mailutskick.",
  path: "/admin/prenumeranter",
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const subscribers = await findAdminSubscribers();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Prenumeranter</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mailadresser som har skrivit upp sig för erbjudanden och kampanjer.
          </p>
        </div>
        <Card className="rounded-lg shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-post</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senaste källa</TableHead>
                  <TableHead>Alla källor</TableHead>
                  <TableHead>Registreringar</TableHead>
                  <TableHead>Senast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.length > 0 ? (
                  subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={subscriber.status === "active" ? "default" : "secondary"}
                        >
                          {subscriber.status === "active" ? "Aktiv" : "Avregistrerad"}
                        </Badge>
                      </TableCell>
                      <TableCell>{subscriber.source}</TableCell>
                      <TableCell className="max-w-72">
                        <span className="line-clamp-2">
                          {subscriber.signup_sources.join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>{subscriber.signup_count}</TableCell>
                      <TableCell>{formatDate(subscriber.last_signup_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Inga prenumeranter ännu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
