// @ts-nocheck
import { Link as LinkIcon } from "lucide-react";

interface AffiliateLinkLabelProps {
  network?: string;
  className?: string;
}

/**
 * Small label to display on offer cards indicating it's an affiliate link
 */
export function AffiliateLinkLabel({ network, className = "" }: AffiliateLinkLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100 ${className}`}
      title={network ? `Affiliate link from ${network}` : "Affiliate link"}
    >
      <LinkIcon className="h-3 w-3" />
      Affiliate
      {network && ` (${network})`}
    </span>
  );
}
