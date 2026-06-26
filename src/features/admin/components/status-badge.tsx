import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  if (status === "published" || status === "active") {
    return <Badge>Aktiv</Badge>;
  }

  if (status === "draft" || status === "inactive") {
    return <Badge variant="secondary">Utkast</Badge>;
  }

  return <Badge variant="outline">Arkiverad</Badge>;
}
