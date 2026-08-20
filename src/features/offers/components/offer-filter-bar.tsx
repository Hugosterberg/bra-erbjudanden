import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Category } from "@/features/categories/types";
import type { Store } from "@/features/stores/types";

import type { OfferSort } from "../sort";

type OfferFilterBarProps = {
  pathname: string;
  categories: Category[];
  stores?: Store[];
  /** Hidden on pages that are already locked to one redemption type. */
  showTypeFilter?: boolean;
  current: {
    category?: string;
    store?: string;
    type?: string;
    sort?: OfferSort;
  };
};

function hrefFor(
  pathname: string,
  current: OfferFilterBarProps["current"],
  patch: Partial<OfferFilterBarProps["current"]>,
) {
  const params = new URLSearchParams();
  const next = { ...current, ...patch };
  if (next.category) {
    params.set("kategori", next.category);
  }
  if (next.store) {
    params.set("butik", next.store);
  }
  if (next.type) {
    params.set("typ", next.type);
  }
  if (next.sort && next.sort !== "featured") {
    params.set("sortering", next.sort);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function FilterLink({
  href,
  label,
  active,
  variant,
}: {
  href: string;
  label: string;
  active: boolean;
  variant: "default" | "secondary" | "outline";
}) {
  return (
    <Button size="sm" variant={active ? variant : "ghost"} asChild>
      <Link href={href} aria-current={active ? "true" : undefined}>
        {label}
      </Link>
    </Button>
  );
}

export function OfferFilterBar({
  pathname,
  categories,
  stores = [],
  showTypeFilter = true,
  current,
}: OfferFilterBarProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sortera erbjudanden">
        {(
          [
            ["featured", "Utvalda"],
            ["score", "Hetast just nu"],
            ["discount", "Störst rabatt"],
            ["newest", "Nyast"],
            ["popular", "Mest klickade"],
          ] as const
        ).map(([value, label]) => (
          <FilterLink
            key={value}
            href={hrefFor(pathname, current, { sort: value })}
            label={label}
            active={(current.sort ?? "featured") === value}
            variant="default"
          />
        ))}
      </div>
      {showTypeFilter ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrera på typ">
          <FilterLink
            href={hrefFor(pathname, current, { type: undefined })}
            label="Alla typer"
            active={!current.type}
            variant="secondary"
          />
          <FilterLink
            href={hrefFor(pathname, current, { type: "rabattkod" })}
            label="Rabattkoder"
            active={current.type === "rabattkod"}
            variant="secondary"
          />
          <FilterLink
            href={hrefFor(pathname, current, { type: "kampanj" })}
            label="Kampanjer"
            active={current.type === "kampanj"}
            variant="secondary"
          />
        </div>
      ) : null}
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrera på kategori">
          <FilterLink
            href={hrefFor(pathname, current, { category: undefined })}
            label="Alla kategorier"
            active={!current.category}
            variant="outline"
          />
          {categories.slice(0, 12).map((category) => (
            <FilterLink
              key={category.id}
              href={hrefFor(pathname, current, { category: category.slug })}
              label={category.name}
              active={current.category === category.slug}
              variant="outline"
            />
          ))}
        </div>
      ) : null}
      {stores.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrera på butik">
          <FilterLink
            href={hrefFor(pathname, current, { store: undefined })}
            label="Alla butiker"
            active={!current.store}
            variant="outline"
          />
          {stores.slice(0, 10).map((store) => (
            <FilterLink
              key={store.id}
              href={hrefFor(pathname, current, { store: store.slug })}
              label={store.name}
              active={current.store === store.slug}
              variant="outline"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
