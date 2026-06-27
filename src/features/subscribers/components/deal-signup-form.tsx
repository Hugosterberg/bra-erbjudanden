"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  initialSubscriberState,
  subscribeToDealsAction,
} from "../actions";

type DealSignupFormProps = {
  source?: string;
  variant?: "default" | "compact";
};

export function DealSignupForm({ source = "homepage", variant = "default" }: DealSignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    subscribeToDealsAction,
    initialSubscriberState,
  );
  const isCompact = variant === "compact";

  return (
    <form action={formAction} className={isCompact ? "space-y-2" : "space-y-3"}>
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
