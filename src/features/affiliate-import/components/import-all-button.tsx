"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { triggerAffiliateImportAction, type ImportActionState } from "../actions";

type ImportAllButtonProps = {
  disabled?: boolean;
  networkCount: number;
  onResult: (result: ImportActionState) => void;
};

export function ImportAllButton({ disabled, networkCount, onResult }: ImportAllButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runImport() {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await triggerAffiliateImportAction();
      onResult(result);
      router.refresh();
    });
  }

  if (networkCount === 0) {
    return (
      <Button type="button" size="lg" disabled>
        Inga nätverk konfigurerade
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {confirmOpen ? (
        <div className="max-w-sm rounded-xl border bg-card p-4 text-sm shadow-sm">
          <p className="font-medium">Kör import för {networkCount} nätverk?</p>
          <p className="mt-1 text-muted-foreground">
            Utgångna erbjudanden kan arkiveras per nätverk när feeden svarar korrekt.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Avbryt
            </Button>
            <Button type="button" size="sm" onClick={runImport} disabled={isPending}>
              Bekräfta
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        type="button"
        size="lg"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || isPending || confirmOpen}
      >
        <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Importerar…" : `Kör ${networkCount} nätverk`}
      </Button>
    </div>
  );
}
