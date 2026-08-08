"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { recordAdImpression, recordAdClick } from "@/features/ad-network/actions";
import type { AdCampaign, AdCreative, AdPlacement } from "../types";

interface AdBannerProps {
  campaign: AdCampaign;
  creative: AdCreative;
  placement: AdPlacement;
  sessionId?: string;
  className?: string;
}

export function AdBanner({ campaign, creative, placement, sessionId, className = "" }: AdBannerProps) {
  useEffect(() => {
    // Record impression on mount
    recordAdImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      placementId: placement.id,
      sessionId,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    });
  }, [campaign.id, creative.id, placement.id, sessionId]);

  const handleClick = () => {
    recordAdClick({
      campaignId: campaign.id,
      creativeId: creative.id,
      sessionId,
    });
  };

  // Text-only ad
  if (creative.creative_type === "text") {
    return (
      <div
        className={`rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950 ${className}`}
      >
        <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Sponsrad</p>
        {creative.headline && <h3 className="mt-2 font-semibold text-neutral-900 dark:text-white">{creative.headline}</h3>}
        {creative.body_text && <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{creative.body_text}</p>}
        <Link
          href={campaign.target_url}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {creative.cta_text || "Läs mer"}
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Image ad
  if (creative.creative_type === "image" && creative.image_url) {
    return (
      <Link
        href={campaign.target_url}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`block overflow-hidden rounded-lg border transition-opacity hover:opacity-80 ${className}`}
      >
        <img
          src={creative.image_url}
          alt={creative.image_alt_text || creative.headline || "Ad"}
          width={placement.width || 300}
          height={placement.height || 250}
          className="h-full w-full object-cover"
        />
        <p className="sr-only">Sponsrad annons</p>
      </Link>
    );
  }

  // HTML ad
  if (creative.creative_type === "html" && creative.html_content) {
    return (
      <div
        className={`rounded-lg border ${className}`}
        onClick={handleClick}
        // eslint-disable-next-line react-no-danger
        dangerouslySetInnerHTML={{ __html: creative.html_content }}
      />
    );
  }

  // Fallback
  return null;
}
