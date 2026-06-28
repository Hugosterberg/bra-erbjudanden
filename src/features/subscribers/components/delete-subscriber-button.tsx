"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteSubscriberAction } from "@/features/subscribers/actions";

type DeleteSubscriberButtonProps = {
  id: string;
  email: string;
};

export function DeleteSubscriberButton({ id, email }: DeleteSubscriberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Ta bort ${email} permanent från databasen?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSubscriberAction(id);

      if (!result.ok) {
        window.alert(result.message ?? "Kunde inte ta bort prenumeranten.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      disabled={isPending}
      aria-label={`Ta bort ${email}`}
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
      {isPending ? "Tar bort..." : "Ta bort"}
    </Button>
  );
}
