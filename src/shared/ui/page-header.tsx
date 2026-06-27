import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderStat = {
  label: string;
  value: number | string;
};

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  stats?: PageHeaderStat[];
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  stats,
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
