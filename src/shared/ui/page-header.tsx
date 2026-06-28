import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderStat = {
  label: string;
  value: number | string;
};

type PageHeaderBackLink = {
  href: string;
  label: string;
};

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  stats?: PageHeaderStat[];
  backLink?: PageHeaderBackLink;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  stats,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/70 bg-secondary/30",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {backLink ? (
          <Link
            href={backLink.href}
            className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            {backLink.label}
          </Link>
        ) : null}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            ) : null}
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
        </div>

        {stats && stats.length > 0 ? (
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="leading-tight">
                <dt className="text-2xl font-semibold tracking-tight" data-numeric>
                  {stat.value}
                </dt>
                <dd className="text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
