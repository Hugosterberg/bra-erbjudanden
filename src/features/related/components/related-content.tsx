import Link from "next/link";

type RelatedLink = {
  href: string;
  title: string;
  description?: string;
};

export function RelatedContent({
  title,
  items,
}: {
  title: string;
  items: RelatedLink[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-primary/25"
            >
              <p className="font-medium">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
