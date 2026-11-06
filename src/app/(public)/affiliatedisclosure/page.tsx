import { Megaphone } from "lucide-react";

import { siteConfig } from "@/shared/config/site";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = createMetadata({
  title: "Annonsinformation – så tjänar vi pengar",
  description:
    "Så tjänar braerbjudanden.se pengar på annonslänkar och sponsrade placeringar, och vad det betyder för dig och för vår ranking.",
  path: "/affiliatedisclosure",
});

const sections = [
  {
    title: "Annonslänkar",
    body: "Många länkar till butiker är annonslänkar. Köper du något efter att ha klickat på en sådan kan vi få provision från butiken eller från ett affiliatenätverk. Priset du betalar påverkas inte av att du kom via oss. Annonslänkar märks ut vid knappen som leder till butiken.",
  },
  {
    title: "Sponsrade placeringar",
    body: "En butik kan betala för att synas extra tydligt. Sådana placeringar märks alltid som Sponsrat. Exklusiva erbjudanden, som vi har tagit fram tillsammans med en butik, märks som Exklusivt erbjudande.",
  },
  {
    title: "Så påverkar det rankingen",
    body: "Sponsring och provision ger inga poäng i Deal Score. Provisionen kan däremot påverka vilka butiker vi väljer att samarbeta med och lägga tid på, och att en butik saknas här betyder inte att den är dålig.",
  },
  {
    title: "Så kontrollerar vi erbjudanden",
    body: "Erbjudanden från affiliatenätverk bygger på uppgifter från nätverket och butiken. Vi tar bort dem när de går ut eller försvinner från nätverket. Bara om det står att vi har kontrollerat ett erbjudande har någon av oss gjort det, och även då kan butiken ha ändrat villkoren sedan dess. Kontrollera därför alltid priset i kassan.",
  },
  {
    title: "Rabatter vi visar",
    body: "Rabatten kommer från butiken eller nätverket. När vi inte kan avgöra rabatten i siffror skriver vi vad erbjudandet är i stället, till exempel Fri frakt. Ett före-pris visar vi bara när butiken eller nätverket har angett ett, och vi kan inte garantera att det är butikens lägsta pris de senaste 30 dagarna.",
  },
];

export default function AffiliateDisclosurePage() {
  return (
    <>
      <PageHeader
        eyebrow="Annonsinformation"
        title="Så tjänar vi pengar"
        description="Sajten är gratis att använda och finansieras av annonslänkar och sponsrade placeringar. Här står vad det betyder för dig."
        icon={Megaphone}
      />
      <section className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{section.body}</p>
          </div>
        ))}
        <p className="rounded-2xl bg-muted/40 p-5 text-sm leading-7">
          Har du frågor om hur vi tjänar pengar? Kontakta oss på{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="font-medium underline underline-offset-2">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>
    </>
  );
}
