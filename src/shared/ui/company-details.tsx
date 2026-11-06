import { siteConfig } from "@/shared/config/site";

/**
 * Provider details required by lagen om elektronisk handel. Missing details are
 * shown as missing instead of being replaced with something plausible.
 */
export function CompanyDetails() {
  const { name, organizationNumber, address } = siteConfig.company;
  const isComplete = Boolean(name && organizationNumber && address);

  return (
    <dl className="grid gap-2 text-sm leading-6 sm:grid-cols-[10rem_1fr]">
      <dt className="font-medium">Företag</dt>
      <dd className="text-muted-foreground">{name ?? "Saknas"}</dd>
      <dt className="font-medium">Organisationsnummer</dt>
      <dd className="text-muted-foreground">{organizationNumber ?? "Saknas"}</dd>
      <dt className="font-medium">Adress</dt>
      <dd className="text-muted-foreground">{address ?? "Saknas"}</dd>
      <dt className="font-medium">E-post</dt>
      <dd className="text-muted-foreground">
        <a href={`mailto:${siteConfig.contactEmail}`} className="underline underline-offset-2">
          {siteConfig.contactEmail}
        </a>
      </dd>
      {!isComplete ? (
        <dd className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm sm:col-span-2">
          Företagsuppgifterna är inte ifyllda ännu. De måste finnas här innan sajten används
          kommersiellt.
        </dd>
      ) : null}
    </dl>
  );
}
