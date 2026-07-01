import { ChevronDown, CircleHelp } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  title: string;
  items: FaqItem[];
};

export function FaqSection({ title, items }: FaqSectionProps) {
  return (
    <section className="border-t border-border/70 bg-muted/25">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <CircleHelp className="size-3.5" />
            Vanliga frågor
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl bg-card px-5 py-4 shadow-soft ring-1 ring-foreground/10 open:ring-primary/25"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
