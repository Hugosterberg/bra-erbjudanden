import Image from "next/image";

import { cn } from "@/lib/utils";

type OfferMediaProps = {
  imageUrl?: string | null;
  title: string;
  discountLabel: string;
  className?: string;
  chipTextClassName?: string;
};

// Renders the offer's product/brand image with the discount as a corner badge.
// When no image is uploaded it falls back to the discount chip so the layout
// (and the discount emphasis) stays intact.
export function OfferMedia({
  imageUrl,
  title,
  discountLabel,
  className,
  chipTextClassName,
}: OfferMediaProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 transition-all duration-300 group-hover:scale-[1.03] group-hover:ring-primary/30",
          className,
        )}
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="128px"
          className="object-cover"
          unoptimized
        />
        <span
          className="absolute left-1.5 top-1.5 rounded-md bg-primary/95 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground shadow-sm backdrop-blur"
          data-numeric
        >
          {discountLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-center text-accent-foreground ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-[1.05] group-hover:[box-shadow:0_12px_28px_-10px_oklch(0.55_0.14_150/0.55)]",
        className,
      )}
      data-numeric
    >
      <span className={cn("font-semibold leading-none", chipTextClassName ?? "text-xl")}>
        {discountLabel}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">rabatt</span>
    </div>
  );
}
