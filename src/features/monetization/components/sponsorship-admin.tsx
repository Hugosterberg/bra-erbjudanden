"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Pause, Play, Trash2 } from "lucide-react";
import type { Sponsorship } from "../types";
import { Button } from "@/components/ui/button";

interface SponsorshipAdminProps {
  sponsorships: Sponsorship[];
  onRefresh?: () => void;
}

export function SponsorshipAdmin({ sponsorships, onRefresh }: SponsorshipAdminProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeSponsorships = sponsorships.filter((s) => s.status === "active");
  const completedSponsorships = sponsorships.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Sponsrade erbjudanden</h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ny sponsorship
        </Button>
      </div>

      {activeSponsorships.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Aktiva sponsorships</h3>
          <div className="divide-y rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {activeSponsorships.map((sponsorship) => (
              <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">Inga aktiva sponsorships</p>
        </div>
      )}

      {completedSponsorships.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Avslutade sponsorships</h3>
          <div className="divide-y rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {completedSponsorships.map((sponsorship) => (
              <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} disabled onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SponsorshipCard({
  sponsorship,
  disabled = false,
  onRefresh,
}: {
  sponsorship: Sponsorship;
  disabled?: boolean;
  onRefresh?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isPaused = sponsorship.status === "paused";

  const handleTogglePause = async () => {
    setIsLoading(true);
    try {
      // TODO: Call action to update sponsorship status
      onRefresh?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex-1">
        <p className="font-medium text-neutral-900 dark:text-white">
          {sponsorship.sponsor_name}
        </p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {sponsorship.pricing_model.toUpperCase()} • {sponsorship.amount} {sponsorship.currency}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {format(new Date(sponsorship.starts_at), "d MMM", { locale: sv })} -{" "}
          {format(new Date(sponsorship.ends_at), "d MMM yyyy", { locale: sv })}
        </p>
        {sponsorship.reserved_position && (
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            Reserverad position: #{sponsorship.reserved_position}
          </p>
        )}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleTogglePause}
            disabled={isLoading}
            title={isPaused ? "Återuppta" : "Pausa"}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
