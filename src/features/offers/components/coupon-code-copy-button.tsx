"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

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
    <button
      type="button"
      onClick={copyCode}
      aria-label={`Kopiera rabattkod ${code}`}
      title={copied ? "Kopierad!" : "Klicka för att kopiera koden"}
      className={cn(
        "group relative flex w-full min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-primary/45 bg-primary/5 py-2 pr-10 pl-3 text-center transition-all duration-300 hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_8px_24px_-12px_oklch(0.55_0.14_150/0.5)]",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-0 font-mono text-base font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere]",
          codeClassName,
        )}
      >
        {code}
      </span>
      <span className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary">
        {copied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Copy className="size-4" />
        )}
      </span>
    </button>
  );
}
