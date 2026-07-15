"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { triggerNetworkImportAction, type ImportActionState } from "../actions";
import type { AffiliateNetwork } from "../types";

type NetworkImportButtonProps = {
  network: AffiliateNetwork;
  configured: boolean;
  compact?: boolean;
  disabled?: boolean;
  onResult: (result: ImportActionState) => void;
};

export function NetworkImportButton({
  network,
  configured,
  compact = false,
  disabled = false,
  onResult,
}: NetworkImportButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await triggerNetworkImportAction(network);
      onResult(result);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={compact ? "outline" : "default"}
      size={compact ? "sm" : "default"}
      className="w-full"
      onClick={handleClick}
      disabled={!configured || isPending || disabled}
    >
      {isPending ? (
        <RefreshCw className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
      {isPending ? "Importerar…" : compact ? "Kör" : "Kör import"}
    </Button>
  );
}
