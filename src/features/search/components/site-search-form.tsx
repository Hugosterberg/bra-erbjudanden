"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordSearchAction } from "@/features/tracking/actions";

type SiteSearchFormProps = {
  initialQuery?: string;
  size?: "default" | "lg" | "compact";
};

export function SiteSearchForm({ initialQuery = "", size = "default" }: SiteSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const isLarge = size === "lg";
  const isCompact = size === "compact";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      void recordSearchAction(trimmed).catch(() => {});
    }
    router.push(trimmed ? `/sok?q=${encodeURIComponent(trimmed)}` : "/sok");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex w-full gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        name="q"
        type="search"
        placeholder={isCompact ? "Sök" : "Sök butik, rabattkod eller guide"}
        aria-label="Sök på sajten"
        className={isLarge ? "h-12 bg-background" : isCompact ? "h-9 bg-background" : "h-10 bg-background"}
      />
      <Button
        type="submit"
        className={isLarge ? "h-12" : isCompact ? "h-9 px-3" : "h-10"}
        aria-label="Sök"
      >
        <Search className="size-4" />
        {isCompact ? <span className="sr-only">Sök</span> : "Sök"}
      </Button>
    </form>
  );
}
