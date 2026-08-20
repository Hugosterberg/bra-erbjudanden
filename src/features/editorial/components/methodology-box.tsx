import { ShieldCheck } from "lucide-react";

import type { MethodologyType } from "../methodology";
import { METHODOLOGY_EXPLANATIONS, formatMethodologyLabel } from "../methodology";

export function MethodologyBox({ methodology }: { methodology: MethodologyType }) {
  return (
    <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
        <ShieldCheck className="size-4" />
        {formatMethodologyLabel(methodology)}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {METHODOLOGY_EXPLANATIONS[methodology]}
      </p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Betyg och ranking är braerbjudandens redaktionella bedömning, inte ett
        crowdsourcat betyg och inte ett påstående om laboratorietester om det
        inte uttryckligen står att produkten är testad av oss.
      </p>
    </aside>
  );
}
