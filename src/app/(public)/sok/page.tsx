import { Search } from "lucide-react";

import { SiteSearchForm } from "@/features/search/components/site-search-form";
import { searchSite } from "@/features/search/queries";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Sök erbjudanden, butiker och guider",
  description: "Sök efter butiker, rabattkoder, kategorier och redaktionella guider på braerbjudanden.se.",
  path: "/sok",
  index: false,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const hits = query.length >= 2 ? await searchSite(query) : [];

  return (
    <>
      <PageHeader
        eyebrow="Sök"
        title="Hitta deals, butiker och guider"
        description="Sök på butiksnamn, rabattkod, kategori eller guide."
        icon={Search}
      />
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <SiteSearchForm initialQuery={query} size="lg" />
        {query.length > 0 && query.length < 2 ? (
          <p className="mt-6 text-sm text-muted-foreground">Skriv minst två tecken.</p>
        ) : null}
        {query.length >= 2 && hits.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Inga träffar för “{query}”. Prova ett butiksnamn eller en kategori.
          </p>
        ) : null}
        {hits.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {hits.map((hit) => (
              <li key={`${hit.type}-${hit.href}`}>
                <Link
                  href={hit.href}
                  className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 hover:ring-primary/25"
                >
                  <p className="text-xs font-medium text-primary">{hit.badge}</p>
                  <h2 className="mt-1 font-semibold">{hit.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{hit.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
