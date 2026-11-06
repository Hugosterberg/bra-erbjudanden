import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";
import {
  sendCampaignAction,
  sendCampaignTestAction,
  sendPendingConfirmationsAction,
} from "@/features/newsletter/actions";
import { CampaignForm } from "@/features/newsletter/components/campaign-form";
import { isMailerConfigured } from "@/features/newsletter/mailer";
import { formatDealHeadline } from "@/features/offers/format";
import { findActiveOffers } from "@/features/offers/queries";
import { createMetadata } from "@/shared/lib/seo";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

export const metadata = createMetadata({
  title: "Admin nyhetsbrev",
  description: "Skapa och skicka utskick till bekräftade prenumeranter.",
  path: "/admin/nyhetsbrev",
});

const STATUS_LABELS = { draft: "Utkast", sending: "Pågår", sent: "Skickat" } as const;

async function countSubscribers(status: "active" | "pending") {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("deal_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  return count ?? 0;
}

async function findCampaigns() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("newsletter_campaigns")
    .select("id, subject, status, sent_at, created_at, offer_ids")
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const [offers, campaigns, activeCount, pendingCount] = await Promise.all([
    findActiveOffers({ limit: 60 }),
    findCampaigns(),
    countSubscribers("active"),
    countSubscribers("pending"),
  ]);
  const mailerReady = isMailerConfigured();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Nyhetsbrev</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeCount} bekräftade prenumeranter och {pendingCount} som inte har bekräftat ännu.
            Utskick går bara till bekräftade.
          </p>
        </div>

        {!mailerReady ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            E-post är inte kopplad. Sätt RESEND_API_KEY och NEWSLETTER_FROM_EMAIL för att kunna
            skicka bekräftelser och utskick. Anmälningar sparas under tiden som obekräftade.
          </div>
        ) : null}

        {mailerReady && pendingCount > 0 ? (
          <form action={sendPendingConfirmationsAction}>
            <Button type="submit" variant="outline">
              Skicka bekräftelse till dem som väntar
            </Button>
          </form>
        ) : null}

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Nytt utskick</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm
              offers={offers.map((offer) => ({
                id: offer.id,
                title: offer.title,
                storeName: offer.store?.name ?? null,
                deal: formatDealHeadline(offer),
              }))}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Utskick</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga utskick ännu.</p>
            ) : null}
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="grid gap-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{campaign.subject}</p>
                  <Badge variant="secondary">{STATUS_LABELS[campaign.status]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {campaign.offer_ids.length} erbjudanden
                  </span>
                </div>
                {campaign.status !== "sent" && mailerReady ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={sendCampaignTestAction} className="flex items-center gap-2">
                      <input type="hidden" name="campaign_id" value={campaign.id} />
                      <Input
                        name="test_email"
                        type="email"
                        required
                        placeholder="test@din-adress.se"
                        className="h-9 w-56"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Skicka test
                      </Button>
                    </form>
                    <form action={sendCampaignAction}>
                      <input type="hidden" name="campaign_id" value={campaign.id} />
                      <Button type="submit" size="sm">
                        {campaign.status === "sending"
                          ? "Fortsätt skicka"
                          : `Skicka till ${activeCount} prenumeranter`}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
