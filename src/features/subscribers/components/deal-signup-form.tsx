"use client";

import { type FormEvent, useState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DealSignupFormProps = {
  source?: string;
  variant?: "default" | "compact";
};

type SubscriberResult = {
  ok: boolean;
  message: string;
};

const initialSubscriberState: SubscriberResult = {
  ok: false,
  message: "",
};

export function DealSignupForm({ source = "homepage", variant = "default" }: DealSignupFormProps) {
  const [state, setState] = useState<SubscriberResult>(initialSubscriberState);
  const [isPending, setIsPending] = useState(false);
  const isCompact = variant === "compact";

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState(initialSubscriberState);

    try {
      const response = await fetch("/api/nyhetsbrev", {
        method: "POST",
        body: new FormData(event.currentTarget),
        headers: {
          Accept: "application/json",
        },
      });
      const result = (await response.json()) as SubscriberResult;

      setState(result);

      if (result.ok) {
        event.currentTarget.reset();
      }
    } catch {
      setState({
        ok: false,
        message: "Kunde inte spara just nu. Försök igen om en stund.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      action="/api/nyhetsbrev"
      method="post"
      onSubmit={submitSignup}
      className={isCompact ? "space-y-2" : "space-y-3"}
    >
      <input type="hidden" name="source" value={source} />
      <div className="hidden">
        <label htmlFor={`${source}-company`}>Företag</label>
        <input id={`${source}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="din@email.se"
          aria-label="E-postadress"
          required
          className={isCompact ? "h-9 bg-background text-sm" : "h-11 bg-background"}
        />
        <Button
          type="submit"
          disabled={isPending}
          size={isCompact ? "sm" : "default"}
          className={isCompact ? "h-9" : "h-11"}
        >
          <MailCheck className="size-4" />
          {isPending ? "Sparar..." : isCompact ? "Bevaka" : "Få erbjudanden"}
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.ok
              ? isCompact ? "text-xs text-primary" : "text-sm text-primary"
              : isCompact ? "text-xs text-destructive" : "text-sm text-destructive"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : (
        <p
          className={
            isCompact
              ? "text-[11px] leading-4 text-muted-foreground"
              : "text-xs leading-5 text-muted-foreground"
          }
        >
          Genom att skriva upp dig samtycker du till mailutskick med
          erbjudanden och kampanjer från braerbjudanden.se.
        </p>
      )}
    </form>
  );
}
