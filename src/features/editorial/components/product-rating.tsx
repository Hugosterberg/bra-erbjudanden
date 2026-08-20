type ProductRatingProps = {
  score: number;
};

export function ProductRating({ score }: { score: number } | ProductRatingProps) {
  return (
    <span className="inline-flex items-baseline gap-1 font-semibold" data-numeric>
      <span className="text-2xl leading-none">{score.toFixed(1)}</span>
      <span className="text-xs font-medium text-muted-foreground">/10</span>
    </span>
  );
}
