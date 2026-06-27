import { BellRing } from "lucide-react";

import { DealSignupForm } from "./deal-signup-form";

type NewsletterSignupPanelProps = {
  source: string;
  title?: string;
  text?: string;
};

export function NewsletterSignupPanel({
  source,
  title = "Få de bästa erbjudandena via mail",
  text = "Skriv upp dig så får du ett kort urval när nya relevanta kampanjer och rabatter dyker upp.",
}: NewsletterSignupPanelProps) {
  return (
    <div className="grid gap-6 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-foreground/10 md:grid-cols-[1fr_24rem] md:items-center">
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm ring-1 ring-primary/20">
          <BellRing className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
      </div>
      <DealSignupForm source={source} />
    </div>
  );
}
