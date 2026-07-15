"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  KeyRound,
  Server,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { NetworkImportProfile } from "../config";
import {
  GENERAL_IMPORT_SETUP,
  getNetworkSetupGuide,
  listNetworkSetupGuides,
} from "../network-setup-guides";
import type { AffiliateNetwork } from "../types";

type NetworkSetupGuidesProps = {
  profiles: NetworkImportProfile[];
  initialNetwork?: AffiliateNetwork;
};

function EnvVarList({
  vars,
  configured,
  missingNames,
}: {
  vars: { name: string; description: string; required: boolean; example?: string }[];
  configured: boolean;
  missingNames?: string[];
}) {
  return (
    <ul className="space-y-3">
      {vars.map((envVar) => {
        const isMissing = missingNames?.includes(envVar.name);

        return (
          <li
            key={envVar.name}
            className={cn(
              "rounded-lg border px-3 py-2",
              isMissing && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs font-medium">{envVar.name}</code>
              {envVar.required ? (
                <Badge variant="outline" className="text-xs">
                  Krävs
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Valfri
                </Badge>
              )}
              {configured && !isMissing ? (
                <CheckCircle2 className="size-3.5 text-primary" aria-label="Konfigurerad" />
              ) : isMissing ? (
                <Circle className="size-3.5 text-amber-600" aria-label="Saknas" />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{envVar.description}</p>
            {envVar.example ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Exempel: <code className="rounded bg-muted px-1">{envVar.example}</code>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function GuideAccordion({
  network,
  profile,
  defaultOpen,
}: {
  network: AffiliateNetwork;
  profile: NetworkImportProfile;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const guide = getNetworkSetupGuide(network);
  const missingNames = profile.configured
    ? []
    : guide.envVars.filter((v) => v.required).map((v) => v.name);

  return (
    <Card
      className={cn(
        "rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5",
        !profile.configured && "border-l-4 border-l-amber-500/60",
        profile.configured && "border-l-4 border-l-primary/40",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{guide.label}</CardTitle>
              {profile.configured ? (
                <Badge variant="default">Konfigurerad</Badge>
              ) : (
                <Badge variant="outline">Ej konfigurerad</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{guide.summary}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            {open ? "Dölj guide" : "Visa guide"}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>

      {open ? (
        <CardContent className="space-y-6 border-t pt-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={guide.publisherPortalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {guide.publisherPortalLabel}
              </a>
            </Button>
            {guide.docsUrl ? (
              <Button variant="ghost" size="sm" asChild>
                <a href={guide.docsUrl} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="size-4" />
                  {guide.docsLabel ?? "Dokumentation"}
                </a>
              </Button>
            ) : null}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Förutsättningar</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {guide.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">Steg för steg</h4>
            <ol className="space-y-3">
              {guide.steps.map((step) => (
                <li key={step.title} className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4" />
              Miljövariabler
            </h4>
            <EnvVarList
              vars={guide.envVars}
              configured={profile.configured}
              missingNames={missingNames}
            />
          </div>

          {guide.vercelNote ? (
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              {guide.vercelNote}
            </p>
          ) : null}

          {guide.notes.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-medium">Tekniska noteringar</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {guide.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function NetworkSetupGuides({ profiles, initialNetwork }: NetworkSetupGuidesProps) {
  const profileByNetwork = Object.fromEntries(profiles.map((profile) => [profile.network, profile]));
  const unconfiguredCount = profiles.filter((profile) => !profile.configured).length;
  const firstUnconfigured = profiles.find((profile) => !profile.configured)?.network;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-foreground/10 shadow-none ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            {GENERAL_IMPORT_SETUP.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{GENERAL_IMPORT_SETUP.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="space-y-3">
            {GENERAL_IMPORT_SETUP.steps.map((step) => (
              <li key={step.title} className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4" />
              Gemensamma miljövariabler
            </h4>
            <EnvVarList vars={GENERAL_IMPORT_SETUP.envVars} configured />
          </div>

          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {GENERAL_IMPORT_SETUP.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Guider per nätverk</h2>
          <p className="text-sm text-muted-foreground">
            {unconfiguredCount > 0
              ? `${unconfiguredCount} nätverk saknar API-uppgifter — expandera guiden för att se exakt vad som behövs.`
              : "Alla nätverk har API-uppgifter konfigurerade."}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="https://vercel.com/docs/projects/environment-variables" target="_blank">
            <ExternalLink className="size-4" />
            Vercel env-variabler
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {listNetworkSetupGuides().map((guide) => {
          const profile = profileByNetwork[guide.network];
          if (!profile) {
            return null;
          }

          return (
            <GuideAccordion
              key={guide.network}
              network={guide.network}
              profile={profile}
              defaultOpen={
                initialNetwork === guide.network ||
                (!initialNetwork &&
                  !profile.configured &&
                  guide.network === firstUnconfigured)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
