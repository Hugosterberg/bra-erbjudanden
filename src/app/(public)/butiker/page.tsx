import { StoreGrid } from "@/features/stores/components/store-grid";
import { findActiveStores } from "@/features/stores/queries";
import { createMetadata } from "@/shared/lib/seo";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Butiker",
  description: "Utforska butiker och varumärken med aktuella erbjudanden.",
  path: "/butiker",
});

export default async function StoresPage() {
  const stores = await findActiveStores();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Butiker</p>
        <h1 className="text-3xl font-semibold tracking-normal">Butiker med erbjudanden</h1>
        <p className="leading-7 text-muted-foreground">
          Samlade butiker och varumärken där du kan hitta aktuella kampanjer.
        </p>
      </div>
      <StoreGrid stores={stores} />
    </section>
  );
}
