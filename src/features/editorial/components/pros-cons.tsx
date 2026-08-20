import { Check, X } from "lucide-react";

type ProsConsProps = {
  pros: string[];
  cons: string[];
};

export function ProsCons({ pros, cons }: ProsConsProps) {
  if (pros.length === 0 && cons.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h3 className="text-sm font-semibold">Fördelar</h3>
        <ul className="mt-3 space-y-2">
          {pros.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h3 className="text-sm font-semibold">Nackdelar</h3>
        <ul className="mt-3 space-y-2">
          {cons.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
