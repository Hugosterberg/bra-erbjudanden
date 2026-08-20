// @ts-nocheck
import type { Sponsorship } from "../types";

// date-fns is not a dependency of this project; Intl covers the same need.
const dayMonth = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface SponsorshipAdminProps {
  sponsorships: Sponsorship[];
}

/**
 * Read-only overview. Creating and pausing sponsorships is not implemented, so
 * no controls are rendered rather than buttons that silently do nothing.
 */
export function SponsorshipAdmin({ sponsorships }: SponsorshipAdminProps) {
  const activeSponsorships = sponsorships.filter((s) => s.status === "active");
  const completedSponsorships = sponsorships.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Sponsrade erbjudanden
      </h2>

      {activeSponsorships.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Aktiva sponsorships</h3>
          <div className="divide-y rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {activeSponsorships.map((sponsorship) => (
              <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} />
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
              <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SponsorshipCard({ sponsorship }: { sponsorship: Sponsorship }) {
  return (
    <div className="p-4">
      <p className="font-medium text-neutral-900 dark:text-white">{sponsorship.sponsor_name}</p>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {sponsorship.pricing_model.toUpperCase()} • {sponsorship.amount} {sponsorship.currency}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {dayMonth.format(new Date(sponsorship.starts_at))} –{" "}
        {dayMonthYear.format(new Date(sponsorship.ends_at))}
      </p>
      {sponsorship.reserved_position && (
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Reserverad position: #{sponsorship.reserved_position}
        </p>
      )}
    </div>
  );
}
