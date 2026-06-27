"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type CouponCodeCopyButtonProps = {
  code: string;
  className?: string;
  codeClassName?: string;
};

const MAX_FONT_PX = 18;
const MIN_FONT_PX = 10;

export function CouponCodeCopyButton({
  code,
  className,
  codeClassName,
}: CouponCodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(MAX_FONT_PX);

  // Shrinks the code to always fit on a single line within the available
  // width, regardless of code length or screen size.
  useLayoutEffect(() => {
    const container = measureRef.current;
    const text = textRef.current;

    if (!container || !text) {
      return;
    }

    let frame = 0;

    const fit = () => {
      const available = container.clientWidth;

      // Layout not settled yet (e.g. inside a hidden/animating parent) —
      // retry on the next frame so we never leave the text clipped.
      if (available === 0) {
        frame = window.requestAnimationFrame(fit);
        return;
      }

      text.style.fontSize = `${MAX_FONT_PX}px`;
      const naturalWidth = text.scrollWidth;

      if (naturalWidth <= available) {
        setFontSize(MAX_FONT_PX);
        return;
      }

      // Subtract a 1px safety buffer to avoid sub-pixel rounding clipping
      // the final glyph.
      const scaled = Math.floor((MAX_FONT_PX * (available - 1)) / naturalWidth);
      setFontSize(Math.max(MIN_FONT_PX, scaled));
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);

    // The monospace webfont is wider than the fallback font; re-measure once
    // it has loaded so we don't size against the wrong metrics.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => {});
    }

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [code]);

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
      <span ref={measureRef} className="min-w-0 flex-1 overflow-hidden">
        <span
          ref={textRef}
          style={{ fontSize: `${fontSize}px` }}
          className={cn(
            "block whitespace-nowrap font-mono font-semibold leading-tight tracking-tight text-foreground",
            codeClassName,
          )}
        >
          {code}
        </span>
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
