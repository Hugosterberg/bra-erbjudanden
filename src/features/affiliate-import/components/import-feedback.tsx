"use client";

import { cn } from "@/lib/utils";

type ImportFeedbackProps = {
  message: string | null;
  ok: boolean | null;
  warning?: boolean;
  errors?: string[];
  onDismiss: () => void;
};

export function ImportFeedback({
  message,
  ok,
  warning = false,
  errors = [],
  onDismiss,
}: ImportFeedbackProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        ok === false && "border-destructive/30 bg-destructive/5 text-destructive",
        warning && "border-amber-500/30 bg-amber-500/5 text-foreground",
        ok === true && !warning && "border-primary/30 bg-primary/5 text-foreground",
        ok === null && "border-border bg-muted/50 text-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p>{message}</p>
          {errors.length > 0 ? (
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs opacity-90">
              {errors.slice(0, 8).map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
              {errors.length > 8 ? (
                <li>… och {errors.length - 8} till i historiken</li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Stäng meddelande"
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}
