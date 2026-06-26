import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/admin/auth";
import { createMetadata } from "@/shared/lib/seo";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = createMetadata({
  title: "Admininloggning",
  description: "Logga in i adminpanelen för braerbjudanden.se.",
  path: "/admin/login",
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <Card className="w-full max-w-md rounded-lg shadow-none">
        <CardHeader>
          <CardTitle>Logga in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signInAction} className="grid gap-5">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  {error === "missing-config"
                    ? "Supabase-miljövariabler saknas."
                    : "Fel e-post eller lösenord, eller så saknas adminprofil."}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit">Logga in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
