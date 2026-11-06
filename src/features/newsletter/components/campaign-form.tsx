"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createCampaignAction, type NewsletterActionState } from "../actions";

type CampaignFormProps = {
  offers: Array<{ id: string; title: string; storeName: string | null; deal: string }>;
};

const initialState: NewsletterActionState = { ok: false, message: "" };

export function CampaignForm({ offers }: CampaignFormProps) {
  const [state, action, isPending] = useActionState(
    (_previous: NewsletterActionState, formData: FormData) => createCampaignAction(formData),
    initialState,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="subject">Ämnesrad</Label>
        <Input id="subject" name="subject" required maxLength={120} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="intro">Inledning (valfritt)</Label>
        <Textarea id="intro" name="intro" maxLength={1000} />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Erbjudanden (högst 12)</legend>
        <div className="grid max-h-80 gap-1 overflow-y-auto rounded-lg border p-2">
          {offers.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Inga aktiva erbjudanden att välja.</p>
          ) : null}
          {offers.map((offer) => (
            <label key={offer.id} className="flex items-start gap-2 rounded p-2 text-sm hover:bg-muted/50">
              <input type="checkbox" name="offer_ids" value={offer.id} className="mt-1" />
              <span>
                {offer.title}
                <span className="block text-xs text-muted-foreground">
                  {[offer.storeName, offer.deal].filter(Boolean).join(" · ")}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sparar..." : "Spara utkast"}
        </Button>
      </div>
    </form>
  );
}
