"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CouponCodeCopyButtonProps = {
  code: string;
  className?: string;
};

export function CouponCodeCopyButton({ code, className }: CouponCodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
    }
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 rounded-md border border-dashed bg-background px-2 py-1.5",
        className,
      )}
    >
      <span className="min-w-0 truncate font-mono text-sm font-medium text-foreground">
        {code}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copyCode}
        aria-label={`Kopiera rabattkod ${code}`}
        className="shrink-0"
      >
        {copied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Copy className="size-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
