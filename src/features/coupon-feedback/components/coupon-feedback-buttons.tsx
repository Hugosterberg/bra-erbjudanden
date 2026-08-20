"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import { submitCouponFeedbackAction } from "../actions";

type CouponFeedbackButtonsProps = {
  offerId: string;
  successLabel?: string | null;
};

export function CouponFeedbackButtons({
  offerId,
  successLabel = null,
}: CouponFeedbackButtonsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [label, setLabel] = useState(successLabel);
  const [vote, setVote] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitVote(worked: boolean) {
    startTransition(async () => {
      const result = await submitCouponFeedbackAction(offerId, worked);
      setMessage(result.message);

      if (result.ok) {
        setVote(worked);
        setLabel(result.successLabel ?? null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p id={`coupon-feedback-${offerId}`} className="text-sm font-medium">
        Fungerade rabattkoden?
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-labelledby={`coupon-feedback-${offerId}`}
      >
        <Button
          type="button"
          size="sm"
          variant={vote === true ? "default" : "outline"}
          disabled={isPending}
          aria-pressed={vote === true}
          onClick={() => submitVote(true)}
        >
          <ThumbsUp className="size-4" />
          Ja
        </Button>
        <Button
          type="button"
          size="sm"
          variant={vote === false ? "default" : "outline"}
          disabled={isPending}
          aria-pressed={vote === false}
          onClick={() => submitVote(false)}
        >
          <ThumbsDown className="size-4" />
          Nej
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {label ?? "Vi visar en procentsiffra först när tillräckligt många har svarat."}
      </p>
      <p className="text-xs text-primary" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
