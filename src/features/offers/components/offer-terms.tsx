import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type OfferTermsProps = {
  terms: string | null;
  className?: string;
};

export function OfferTerms({ terms, className }: OfferTermsProps) {
  if (!terms?.trim()) {
    return null;
  }

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="size-3.5 shrink-0 text-primary" />
      <span>{terms}</span>
    </p>
  );
}
