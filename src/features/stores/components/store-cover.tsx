"use client";

import Image from "next/image";
import { useState } from "react";

import { StoreLogo } from "@/shared/ui/store-logo";

type StoreCoverProps = {
  name: string;
  screenshotUrl: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

export function StoreCover({
  name,
  screenshotUrl,
  logoUrl,
  websiteUrl,
}: StoreCoverProps) {
  const [errored, setErrored] = useState(false);

  if (screenshotUrl && !errored) {
    return (
      <Image
        src={screenshotUrl}
        alt={`${name} förstasida`}
        fill
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        onError={() => setErrored(true)}
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-background">
      <StoreLogo
        name={name}
        logoUrl={logoUrl}
        websiteUrl={websiteUrl}
        size="lg"
        className="size-16"
      />
    </div>
  );
}
