"use client";

import { type FormEvent, useState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { NEWSLETTER_INTERESTS } from "../interests";

type DealSignupFormProps = {
  source?: string;
  showInterests?: boolean;
};

type SubscriberResult = {
  ok: boolean;
  message: string;
};

const initialSubscriberState: SubscriberResult = {
  ok: false,
  message: "",
};

export function DealSignupForm({ source = "homepage", showInterests = true }: DealSignupFormProps) {
  const [state, setState] = useState<SubscriberResult>(initialSubscriberState);
  const [isPending, setIsPending] = useState(false);

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsPending(true);
    setState(initialSubscriberState);

    try {
      const response = await fetch("/api/nyhetsbrev", {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });
      const result = (await response.json()) as SubscriberResult;

      setState(result);

      if (result.ok) {
        form.reset();
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
      className="space-y-3"
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
          className="h-11 bg-background"
        />
        <Button type="submit" disabled={isPending} className="h-11">
          <MailCheck className="size-4" />
          {isPending ? "Sparar..." : "Få erbjudanden"}
        </Button>
      </div>
      {showInterests ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            Intressen (valfritt) – används när mailutskick kopplas på
          </legend>
          <div className="flex flex-wrap gap-2">
            {NEWSLETTER_INTERESTS.map((interest) => (
              <label
                key={interest.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs ring-1 ring-foreground/10"
              >
                <input type="checkbox" name="interests" value={interest.id} className="size-3.5" />
                {interest.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {state.message ? (
        <p
          className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Genom att skriva upp dig samtycker du till mailutskick med
          erbjudanden och kampanjer från braerbjudanden.se.
        </p>
      )}
    </form>
  );
}
