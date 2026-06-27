"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CouponCodeCopyButtonProps = {
  code: string;
  className?: string;
  codeClassName?: string;
};

export function CouponCodeCopyButton({
  code,
  className,
  codeClassName,
}: CouponCodeCopyButtonProps) {
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
        "grid min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-dashed border-primary/45 bg-primary/5 px-3 py-2",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate text-center font-mono text-base font-semibold text-foreground",
          codeClassName,
        )}
      >
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
