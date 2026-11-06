export type SeasonalPage = {
  path: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  /** Used to pick offers whose text mentions the campaign. */
  keywords: string[];
  tips: Array<{ title: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
};

const CHECK_PRICE_TIP = {
  title: "Jämför priset innan rean",
  body: "En rabatt säger inget om den räknas från ett högt pris. Spara priset på det du vill ha några veckor innan och kontrollera i en prisjämförelse att kampanjpriset faktiskt är lägre.",
};

const RETURNS_TIP = {
  title: "Läs retur- och fraktvillkoren",
  body: "Villkoren kan skilja sig under kampanjer. Ångerrätten på 14 dagar gäller som regel vid köp på nätet, men kontrollera vem som betalar returfrakten.",
};

export const SEASONAL_PAGES: Record<string, SeasonalPage> = {
  "black-friday": {
    path: "/black-friday",
    eyebrow: "Kampanj",
    title: "Black Friday – erbjudanden och rabattkoder",
    metaTitle: "Black Friday 2026 – erbjudanden och rabattkoder",
    description:
      "Aktuella Black Friday-erbjudanden från svenska butiker, med tips för att se om rabatten faktiskt är bra. Black Friday 2026 infaller den 27 november.",
    intro:
      "Black Friday infaller 2026 den 27 november och Cyber Monday den 30 november. Många butiker startar tidigare och håller på längre. Här samlar vi kampanjerna som är aktiva just nu, tillsammans med råd för att skilja en riktig rabatt från ett bra upplagt pris.",
    keywords: ["black friday", "black week", "cyber monday", "singles day"],
    tips: [
      CHECK_PRICE_TIP,
      RETURNS_TIP,
      {
        title: "Gör en lista i förväg",
        body: "Bestäm vad du behöver innan kampanjerna börjar. Då är det lättare att stå emot erbjudanden som bara ser bra ut för att de tar slut snart.",
      },
    ],
    faq: [
      {
        question: "När är Black Friday 2026?",
        answer:
          "Black Friday 2026 infaller fredagen den 27 november, och Cyber Monday följer måndagen den 30 november.",
      },
      {
        question: "Är priserna verkligen lägst på Black Friday?",
        answer:
          "Inte alltid. Butiker ska ange det lägsta priset de tillämpat de senaste 30 dagarna när de marknadsför en prissänkning, men jämför gärna själv mot andra butiker.",
      },
    ],
  },
  mellandagsrea: {
    path: "/mellandagsrea",
    eyebrow: "Kampanj",
    title: "Mellandagsrea – erbjudanden och rabattkoder",
    metaTitle: "Mellandagsrea – erbjudanden och rabattkoder",
    description:
      "Aktuella erbjudanden från mellandagsrean hos svenska butiker, med råd om rabatter, returer och presentkort.",
    intro:
      "Mellandagsrean brukar dra igång runt annandag jul, och många butiker börjar redan på nätet. Här samlar vi kampanjerna som är aktiva just nu och det som är bra att tänka på när du handlar under rean.",
    keywords: ["mellandagsrea", "mellandagsrean", "mellandagar", "nyårsrea", "julrea"],
    tips: [
      CHECK_PRICE_TIP,
      RETURNS_TIP,
      {
        title: "Kontrollera presentkort och öppet köp",
        body: "Kontrollera om presentkort gäller på reavaror och om förlängt öppet köp från julhandeln påverkar det du tänker byta.",
      },
    ],
    faq: [
      {
        question: "När börjar mellandagsrean?",
        answer:
          "Det bestämmer varje butik själv. Rean brukar starta runt annandag jul, ofta tidigare på nätet än i fysiska butiker.",
      },
      {
        question: "Kan jag lämna tillbaka reavaror?",
        answer:
          "Vid köp på nätet gäller som regel ångerrätt i 14 dagar även på reavaror. Öppet köp i butik är frivilligt och kan vara begränsat under rean.",
      },
    ],
  },
};

export const SEASONAL_PAGE_PATHS = Object.values(SEASONAL_PAGES).map((page) => page.path);

export function matchesSeasonalKeywords(
  offer: { title: string; description: string },
  keywords: string[],
) {
  const text = `${offer.title} ${offer.description}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}
