/**
 * What is still missing for the site to work in production. Reports only whether
 * a setting exists, never its value. Pure so that it can be tested.
 */
export type SetupCheck = {
  label: string;
  ok: boolean;
  required: boolean;
  hint: string;
};

type Env = Record<string, string | undefined>;

const NETWORK_VARIABLES = [
  ["ADDREVENUE_API_TOKEN", "ADDREVENUE_CHANNEL_ID"],
  ["ADTRACTION_API_TOKEN", "ADTRACTION_CHANNEL_ID"],
  ["ADRECORD_API_KEY", "ADRECORD_CHANNEL_ID"],
  ["AWIN_ACCESS_TOKEN", "AWIN_PUBLISHER_ID"],
  ["TRADEDOUBLER_VOUCHERS_TOKEN"],
];

function hasAll(env: Env, ...names: string[]) {
  return names.every((name) => Boolean(env[name]?.trim()));
}

export function buildSetupChecks(env: Env, input: { migrationsApplied: boolean }): SetupCheck[] {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();

  return [
    {
      label: "Databasmigrationer",
      ok: input.migrationsApplied,
      required: true,
      hint: "Kör npm run db:push. Utan dem blir de publika sidorna tomma.",
    },
    {
      label: "Schemalagda jobb",
      ok: hasAll(env, "CRON_SECRET"),
      required: true,
      hint: "Sätt CRON_SECRET. Annars nekas import, provisionshämtning och gallring.",
    },
    {
      label: "Hashning av IP-adresser",
      ok: hasAll(env, "CLICK_HASH_SALT"),
      required: true,
      hint: "Sätt CLICK_HASH_SALT till ett långt slumpvärde och byt det inte i onödan.",
    },
    {
      label: "Företagsuppgifter",
      ok: hasAll(
        env,
        "NEXT_PUBLIC_COMPANY_NAME",
        "NEXT_PUBLIC_COMPANY_ORG_NUMBER",
        "NEXT_PUBLIC_COMPANY_ADDRESS",
      ),
      required: true,
      hint: "Sätt namn, organisationsnummer och adress. De krävs enligt lagen om elektronisk handel.",
    },
    {
      label: "Sajtens adress",
      ok: !siteUrl || !siteUrl.includes("localhost"),
      required: true,
      hint: "NEXT_PUBLIC_SITE_URL pekar på localhost. Då blir länkar i mejl och sökmotorer fel.",
    },
    {
      label: "Affiliatenätverk",
      ok: NETWORK_VARIABLES.some((names) => hasAll(env, ...names)),
      required: false,
      hint: "Lägg till API-uppgifter när du är godkänd hos ett nätverk. Se Import.",
    },
    {
      label: "E-post",
      ok: hasAll(env, "RESEND_API_KEY", "NEWSLETTER_FROM_EMAIL"),
      required: false,
      hint: "Sätt RESEND_API_KEY och NEWSLETTER_FROM_EMAIL. Annars skickas inga bekräftelser.",
    },
    {
      label: "Google Search Console",
      ok: hasAll(env, "GOOGLE_SITE_VERIFICATION"),
      required: false,
      hint: "Sätt GOOGLE_SITE_VERIFICATION, eller verifiera domänen via DNS och bortse från detta.",
    },
  ];
}
