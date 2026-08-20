import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Annonsörsportalen",
  description: "Portal för annonsörer som samarbetar med braerbjudanden.se.",
  path: "/advertiser/dashboard",
  index: false,
});

export default function AdvertiserDashboardPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Annonsörsportalen</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Inloggning för annonsörer är inte aktiverad ännu. Vill du annonsera eller
        samarbeta, kontakta oss via partnersidan.
      </p>
      <p className="mt-6 text-sm">
        <a href="/partner" className="font-medium text-primary">
          Gå till partner
        </a>
      </p>
    </main>
  );
}
