import { Store } from "lucide-react";

import { StoreGrid } from "@/features/stores/components/store-grid";
import { findActiveStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Butiker med rabattkoder & erbjudanden",
  description:
    "Utforska svenska butiker och varumärken med aktuella rabatter, rabattkoder och kampanjer. Hitta bra erbjudanden från butikerna du gillar.",
  path: "/butiker",
});

export default async function StoresPage() {
  const stores = await findActiveStores();

  return (
    <>
      <PageHeader
        eyebrow="Butiker"
        title="Butiker med erbjudanden"
        description="Samlade butiker och varumärken där du kan hitta aktuella kampanjer och rabattkoder."
        icon={Store}
        stats={[{ value: stores.length, label: "aktiva butiker" }]}
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <StoreGrid stores={stores} />
      </section>
    </>
  );
}
