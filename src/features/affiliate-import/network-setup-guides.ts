import type { AffiliateNetwork } from "./types";

export type SetupGuideStep = {
  title: string;
  description: string;
};

export type EnvVarGuide = {
  name: string;
  description: string;
  required: boolean;
  example?: string;
};

export type NetworkSetupGuide = {
  network: AffiliateNetwork;
  label: string;
  summary: string;
  publisherPortalUrl: string;
  publisherPortalLabel: string;
  docsUrl?: string;
  docsLabel?: string;
  prerequisites: string[];
  steps: SetupGuideStep[];
  envVars: EnvVarGuide[];
  vercelNote?: string;
  notes: string[];
};

export type GeneralSetupGuide = {
  title: string;
  description: string;
  envVars: EnvVarGuide[];
  steps: SetupGuideStep[];
  notes: string[];
};

export const GENERAL_IMPORT_SETUP: GeneralSetupGuide = {
  title: "Gemensam driftsättning",
  description:
    "Nycklar läggs i Vercel (produktion) och `.env.local` (lokal utveckling). Importer körs aldrig i webbläsaren — allt sker server-side.",
  envVars: [
    {
      name: "CRON_SECRET",
      description:
        "Hemlig sträng som skyddar schemalagd import. Vercel Cron skickar den som Authorization-header.",
      required: true,
      example: "lång-slumpmässig-sträng",
    },
    {
      name: "AFFILIATE_IMPORT_CRON_SKIP",
      description:
        "Valfritt. Kommaseparerade nätverks-id som hoppas över i schemalagd import men kan köras manuellt.",
      required: false,
      example: "awin,tradedoubler",
    },
  ],
  steps: [
    {
      title: "1. Bli godkänd som publisher",
      description:
        "Registrera dig som affiliate/partner hos respektive nätverk och vänta på godkännande innan API:er ger data.",
    },
    {
      title: "2. Hämta API-uppgifter",
      description:
        "Följ guiden för varje nätverk nedan. Du behöver oftast både en API-nyckel/token och ett kanal-/site-id.",
    },
    {
      title: "3. Lägg till miljövariabler",
      description:
        "Sätt variablerna i Vercel → Project → Settings → Environment Variables. Starta om eller redeploya efter ändring.",
    },
    {
      title: "4. Testa manuellt",
      description:
        "Gå till Nätverk-fliken, kör import för ett nätverk i taget och kontrollera historik samt publicerade erbjudanden.",
    },
    {
      title: "5. Verifiera schemalagd import",
      description:
        "När CRON_SECRET är satt körs import två gånger per dygn via Vercel Cron. Kontrollera att körningar loggas under Historik.",
    },
  ],
  notes: [
    "Lägg aldrig API-nycklar i kod eller i publika repo.",
    "Du kan aktivera ett nätverk i taget — saknade variabler inaktiverar bara det nätverket.",
    "Kör `npm run test:import` lokalt för att testa adapters utan admin-UI.",
  ],
};

export const NETWORK_SETUP_GUIDES: Record<AffiliateNetwork, NetworkSetupGuide> = {
  addrevenue: {
    network: "addrevenue",
    label: "Addrevenue",
    summary:
      "Svenskt affiliatenätverk. Importen hämtar kampanjer och annonsörer via Addrevenues API v2.",
    publisherPortalUrl: "https://addrevenue.io",
    publisherPortalLabel: "addrevenue.io",
    docsUrl: "https://addrevenue.io/sv/affiliate",
    docsLabel: "Addrevenue för affiliates",
    prerequisites: [
      "Godkänt konto som affiliate/partner hos Addrevenue.",
      "Minst en aktiv kanal (webbplats) kopplad till kontot.",
    ],
    steps: [
      {
        title: "1. Logga in på Addrevenue",
        description:
          "Gå till publisher-kontot och kontrollera att du är godkänd och har minst en kanal registrerad för braerbjudanden.se.",
      },
      {
        title: "2. Skapa eller hitta API-token",
        description:
          "Under kontoinställningar/API (eller motsvarande meny) skapar du en API-token med läsrättigheter för kampanjer och annonsörer.",
      },
      {
        title: "3. Hitta channelId",
        description:
          "Channel ID är id:t för din kanal/webbplats i Addrevenue. Det skickas som query-parameter till API:et och måste matcha kanalen du importerar för.",
      },
      {
        title: "4. Sätt miljövariabler",
        description:
          "Lägg ADDREVENUE_API_TOKEN och ADDREVENUE_CHANNEL_ID i Vercel och `.env.local`.",
      },
      {
        title: "5. Kör första importen",
        description:
          "Testa manuellt från Nätverk-fliken. Kontrollera att butiker skapas och erbjudanden publiceras.",
      },
    ],
    envVars: [
      {
        name: "ADDREVENUE_API_TOKEN",
        description: "Bearer-token för Addrevenue API v2.",
        required: true,
      },
      {
        name: "ADDREVENUE_CHANNEL_ID",
        description: "Id för kanalen/webbplatsen i Addrevenue.",
        required: true,
        example: "12345",
      },
    ],
    vercelNote: "Rekommenderat som första nätverk att aktivera — enkelt svenskt API.",
    notes: [
      "API-bas: addrevenue.io/api/v2 (campaigns + advertisers).",
      "Importen filtrerar bort utgångna kampanjer automatiskt.",
    ],
  },

  adtraction: {
    network: "adtraction",
    label: "Adtraction",
    summary:
      "Nordens största affiliatenätverk. Importen hämtar partner-erbjudanden för marknaden SE.",
    publisherPortalUrl: "https://publishers.adtraction.com",
    publisherPortalLabel: "Adtraction Publisher",
    docsUrl: "https://adtraction.com/sv/for-partners/",
    docsLabel: "Adtraction för partners",
    prerequisites: [
      "Godkänt Adtraction-konto som publisher.",
      "En aktiv kanal (site) med marknad Sverige.",
    ],
    steps: [
      {
        title: "1. Logga in som publisher",
        description:
          "Öppna Adtractions publisher-portal och kontrollera att din kanal för braerbjudanden.se är godkänd.",
      },
      {
        title: "2. Hämta API-token (X-Token)",
        description:
          "Under API/inställningar skapar eller kopierar du din partner-API-token. Den skickas som header X-Token.",
      },
      {
        title: "3. Hitta channelId",
        description:
          "Channel ID är det numeriska id:t för din kanal/site i Adtraction. Det används i POST-body till /partner/offers/.",
      },
      {
        title: "4. Sätt miljövariabler",
        description:
          "Lägg ADTRACTION_API_TOKEN och ADTRACTION_CHANNEL_ID i Vercel och `.env.local`.",
      },
      {
        title: "5. Verifiera svenska erbjudanden",
        description:
          "Importen filtrerar på market SE. Kör manuell import och kontrollera att erbjudanden dyker upp.",
      },
    ],
    envVars: [
      {
        name: "ADTRACTION_API_TOKEN",
        description: "Partner-API-token (skickas som X-Token).",
        required: true,
      },
      {
        name: "ADTRACTION_CHANNEL_ID",
        description: "Numeriskt kanal-/site-id i Adtraction.",
        required: true,
        example: "1234567890",
      },
    ],
    notes: [
      "API-bas: api.adtraction.net/v3/partner/offers/",
      "Erbjudanden med market ≠ SE ignoreras.",
    ],
  },

  adrecord: {
    network: "adrecord",
    label: "Adrecord",
    summary:
      "Svenskt affiliatenätverk. Importen hämtar kuponger och kampanjer för svenska program.",
    publisherPortalUrl: "https://login.adrecord.com",
    publisherPortalLabel: "Adrecord inloggning",
    docsUrl: "https://www.adrecord.com/sv/affiliate",
    docsLabel: "Adrecord affiliate",
    prerequisites: [
      "Godkänt Adrecord-konto.",
      "En kanal kopplad till webbplatsen.",
    ],
    steps: [
      {
        title: "1. Logga in på Adrecord",
        description:
          "Kontrollera att du har godkända program och en aktiv kanal för din sajt.",
      },
      {
        title: "2. Skapa API-nyckel",
        description:
          "Under API-inställningar skapar du en APIKEY som skickas som header APIKEY i alla anrop.",
      },
      {
        title: "3. Hitta channel-id",
        description:
          "Channel-id är id:t för din kanal i Adrecord. Det skickas som query-parameter channel= vid hämtning av kuponger/kampanjer.",
      },
      {
        title: "4. Sätt miljövariabler",
        description:
          "Lägg ADRECORD_API_KEY och ADRECORD_CHANNEL_ID i Vercel och `.env.local`.",
      },
      {
        title: "5. Respektera rate limit",
        description:
          "Adrecord har rate limits (~30 anrop/30 s). Schemalagd import väntar 2 sekunder mellan nätverk.",
      },
    ],
    envVars: [
      {
        name: "ADRECORD_API_KEY",
        description: "API-nyckel (header APIKEY).",
        required: true,
      },
      {
        name: "ADRECORD_CHANNEL_ID",
        description: "Numeriskt kanal-id i Adrecord.",
        required: true,
        example: "42",
      },
    ],
    notes: [
      "API-bas: api.v2.adrecord.com (coupons + campaigns, market=se).",
      "Kuponger och kampanjer importeras som separata erbjudanden.",
    ],
  },

  awin: {
    network: "awin",
    label: "Awin",
    summary:
      "Internationellt nätverk. Importen hämtar aktiva promotions filtrerade på region (standard SE).",
    publisherPortalUrl: "https://ui.awin.com",
    publisherPortalLabel: "Awin Publisher UI",
    docsUrl: "https://developer.awin.com/apidocs/promotions",
    docsLabel: "Awin Promotions API",
    prerequisites: [
      "Godkänt Awin publisher-konto.",
      "Access till Promotions API (OAuth/API-credentials).",
      "Publisher ID synligt i kontot eller URL.",
    ],
    steps: [
      {
        title: "1. Logga in på Awin",
        description:
          "Öppna publisher-gränssnittet och kontrollera att du har aktiva annonsörer/program.",
      },
      {
        title: "2. Skapa API-access token",
        description:
          "Via Awin Developer / API-inställningar skapar du en access token med rätt att läsa promotions för ditt publisher-konto.",
      },
      {
        title: "3. Hitta Publisher ID",
        description:
          "Publisher ID är ditt numeriska konto-id i Awin. Det används i API-URL:en /publisher/{publisherId}/promotions.",
      },
      {
        title: "4. Valfritt: regionkod",
        description:
          "AWIN_REGION_CODE styr regionsfilter (standard SE). Sätt annan kod om du vill importera annan marknad.",
      },
      {
        title: "5. Sätt miljövariabler och testa",
        description:
          "Lägg AWIN_ACCESS_TOKEN och AWIN_PUBLISHER_ID i Vercel. Kör manuell import — Awin paginerar upp till 10 000 promotions.",
      },
    ],
    envVars: [
      {
        name: "AWIN_ACCESS_TOKEN",
        description: "Bearer-token för Awin API.",
        required: true,
      },
      {
        name: "AWIN_PUBLISHER_ID",
        description: "Ditt publisher-konto-id i Awin.",
        required: true,
        example: "123456",
      },
      {
        name: "AWIN_REGION_CODE",
        description: "Regionsfilter för promotions. Standard SE om variabeln saknas.",
        required: false,
        example: "SE",
      },
    ],
    notes: [
      "API-bas: api.awin.com/publisher/{publisherId}/promotions",
      "Stort nätverk — första importen kan ta längre tid.",
      "Överväg AFFILIATE_IMPORT_CRON_SKIP=awin tills du verifierat att allt fungerar.",
    ],
  },

  tradedoubler: {
    network: "tradedoubler",
    label: "Tradedoubler",
    summary:
      "Vouchers-API med rabattkoder och kampanjer från svenska och europeiska program.",
    publisherPortalUrl: "https://publishers.tradedoubler.com",
    publisherPortalLabel: "Tradedoubler Publisher",
    docsUrl: "https://dev.tradedoubler.com/vouchers/",
    docsLabel: "Tradedoubler Vouchers API",
    prerequisites: [
      "Godkänt Tradedoubler publisher-konto.",
      "Access till Vouchers API / token från kontoinställningar.",
    ],
    steps: [
      {
        title: "1. Logga in på Tradedoubler",
        description:
          "Kontrollera att du har godkända program och att vouchers/rabattkoder är tillgängliga för ditt konto.",
      },
      {
        title: "2. Hämta Vouchers-token",
        description:
          "Under API- eller verktygsinställningar skapar du en token för Vouchers API. Den skickas som query-parameter token=.",
      },
      {
        title: "3. Sätt miljövariabel",
        description:
          "Lägg TRADEDOUBLER_VOUCHERS_TOKEN i Vercel och `.env.local`.",
      },
      {
        title: "4. Kör import och granska",
        description:
          "Vouchers returneras som både rabattkoder och direktlänkar. Kontrollera att butiksnamn och rabatt parsas rimligt.",
      },
    ],
    envVars: [
      {
        name: "TRADEDOUBLER_VOUCHERS_TOKEN",
        description: "Token för Vouchers API.",
        required: true,
      },
    ],
    notes: [
      "API: api.tradedoubler.com/1.0/vouchers.json",
      "Endast en miljövariabel krävs jämfört med övriga nätverk.",
    ],
  },
};

export function getNetworkSetupGuide(network: AffiliateNetwork) {
  return NETWORK_SETUP_GUIDES[network];
}

export function listNetworkSetupGuides() {
  return Object.values(NETWORK_SETUP_GUIDES);
}
