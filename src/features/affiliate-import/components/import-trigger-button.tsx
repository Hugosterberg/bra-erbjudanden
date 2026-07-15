"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { triggerAffiliateImportAction } from "../actions";

export function ImportTriggerButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await triggerAffiliateImportAction();
      window.alert(result.message);
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Importerar…" : "Kör import nu"}
    </Button>
  );
}
