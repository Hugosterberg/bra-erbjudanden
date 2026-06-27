"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type StoreLogoProps = {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-5 text-[10px]",
  md: "size-9 text-sm",
  lg: "size-12 text-base",
} as const;

const imageSizes = {
  sm: 20,
  md: 36,
  lg: 48,
} as const;

function getStoreInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Derives a favicon URL from a store website so brands without an uploaded
// logo still get a recognizable mark. Falls back to the initial on error.
function getFaviconUrl(websiteUrl: string, size: number) {
  try {
    const url = new URL(
      websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
    );

    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${size >= 48 ? 128 : 64}`;
  } catch {
    return null;
  }
}

export function StoreLogo({
  name,
  logoUrl,
  websiteUrl,
  size = "md",
  className,
}: StoreLogoProps) {
  const [errored, setErrored] = useState(false);
  const sizeClass = sizeClasses[size];

  const resolvedSrc =
    logoUrl || (websiteUrl ? getFaviconUrl(websiteUrl, imageSizes[size]) : null);

  if (resolvedSrc && !errored) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border/70",
          sizeClass,
          className,
        )}
      >
        <Image
          src={resolvedSrc}
          alt={`${name} logotyp`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="size-full object-contain p-0.5"
          onError={() => setErrored(true)}
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold uppercase text-primary ring-1 ring-primary/15",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {getStoreInitial(name)}
    </span>
  );
}
