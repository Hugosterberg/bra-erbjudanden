import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { buildSetupChecks } from "../setup-status";

async function areMigrationsApplied() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  // This column arrives with the latest migrations, which are applied together.
  const { error } = await supabase.from("offers").select("market", { head: true });

  return !error;
}

export async function SetupStatusCard() {
  const checks = buildSetupChecks(process.env, { migrationsApplied: await areMigrationsApplied() });
  const missing = checks.filter((check) => !check.ok);

  if (missing.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Kvar att ställa in</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 text-sm">
          {missing.map((check) => (
            <li key={check.label}>
              <span className="font-medium">
                {check.label}
                {check.required ? " (krävs)" : ""}:
              </span>{" "}
              <span className="text-muted-foreground">{check.hint}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
