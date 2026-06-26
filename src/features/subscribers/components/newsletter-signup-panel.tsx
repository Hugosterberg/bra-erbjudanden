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
    <div className="grid gap-5 rounded-lg border bg-card p-5 shadow-sm md:grid-cols-[1fr_420px] md:items-center">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <BellRing className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
      </div>
      <DealSignupForm source={source} />
    </div>
  );
}
