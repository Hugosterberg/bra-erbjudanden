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
};

export function DealSignupForm({ source = "homepage" }: DealSignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    subscribeToDealsAction,
    initialSubscriberState,
  );

  return (
    <form action={formAction} className="space-y-3">
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
          className="h-11 bg-background"
        />
        <Button type="submit" disabled={isPending} className="h-11">
          <MailCheck className="size-4" />
          {isPending ? "Sparar..." : "Få erbjudanden"}
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.ok
              ? "text-sm text-primary"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Ingen spam. Bara ett kuraterat urval när något faktiskt är värt din
          uppmärksamhet.
        </p>
      )}
    </form>
  );
}
