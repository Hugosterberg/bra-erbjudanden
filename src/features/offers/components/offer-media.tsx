import Image from "next/image";

import { cn } from "@/lib/utils";

type OfferMediaProps = {
  imageUrl?: string | null;
  title: string;
  discountLabel: string;
  className?: string;
  chipTextClassName?: string;
};

// Renders the offer's product/brand image. The discount is shown separately
// via OfferDiscountBadge, so the image stays clean and high quality. When no
// image is uploaded it falls back to a discount chip to keep the layout intact.
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
          sizes="(min-width: 1024px) 160px, 128px"
          className="object-contain p-2"
          unoptimized
        />
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
