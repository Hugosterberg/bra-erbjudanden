import Link from "next/link";
import { Info } from "lucide-react";

interface AffiliateDisclosureBadgeProps {
  compact?: boolean;
  className?: string;
}

export function AffiliateDisclosureBadge({ compact = false, className = "" }: AffiliateDisclosureBadgeProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs text-neutral-500 ${className}`}>
        <Info className="h-3 w-3" />
        <span>
          Vi använder{" "}
          <Link href="/affiliatedisclosure" className="underline hover:text-neutral-700">
            affiliatelänkar
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100 ${className}`}>
      <div className="flex gap-3">
        <Info className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Affiliateöppet</p>
          <p className="mt-1 text-xs opacity-90">
            Vi tjänar pengar när du klickar på erbjudandena och gör ett köp. Det kostar dig ingenting extra, men hjälper
            oss att hålla sajten gratis och uppdaterad.{" "}
            <Link href="/affiliatedisclosure" className="underline hover:opacity-75">
              Läs mer om hur det fungerar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
