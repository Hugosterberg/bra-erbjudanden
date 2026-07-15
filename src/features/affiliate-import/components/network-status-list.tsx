import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AFFILIATE_NETWORKS } from "../types";
import { isNetworkConfigured } from "../config";
import { formatNetworkLabel } from "../network-labels";

type NetworkStatusListProps = {
  importedCounts: Record<string, number>;
};

export function NetworkStatusList({ importedCounts }: NetworkStatusListProps) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Affiliatenätverk</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {AFFILIATE_NETWORKS.map((network) => {
          const configured = isNetworkConfigured(network);
          return (
            <div
              key={network}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div>
                <p className="font-medium">{formatNetworkLabel(network)}</p>
                <p className="text-xs text-muted-foreground">
                  {configured
                    ? `${importedCounts[network] ?? 0} publicerade importerade erbjudanden`
                    : "API-uppgifter saknas i miljövariabler"}
                </p>
              </div>
              <Badge variant={configured ? "default" : "secondary"}>
                {configured ? "Aktiv" : "Ej konfigurerad"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
