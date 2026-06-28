"use client";

import { type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteSubscriberAction } from "@/features/subscribers/actions";

type DeleteSubscriberButtonProps = {
  id: string;
  email: string;
};

export function DeleteSubscriberButton({ id, email }: DeleteSubscriberButtonProps) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Ta bort ${email} permanent från databasen?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteSubscriberAction.bind(null, id)} onSubmit={confirmDelete}>
      <Button variant="outline" size="sm" type="submit" aria-label={`Ta bort ${email}`}>
        <Trash2 className="size-4" />
        Ta bort
      </Button>
    </form>
  );
}
