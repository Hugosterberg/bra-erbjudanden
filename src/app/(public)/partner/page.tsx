import { Handshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/shared/config/site";
import { createMetadata } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = createMetadata({
  title: "Partner – samarbeta med braerbjudanden.se",
  description:
    "Erbjudanden, exklusiva rabattkoder, sponsrade kampanjer och nyhetssamarbeten för butiker och varumärken som vill nå svenska shoppare.",
  path: "/partner",
});

const offerings = [
  {
    title: "Skicka in ett erbjudande",
    body: "Har du en aktuell kampanj eller rabattkod? Vi granskar den redaktionellt innan den publiceras.",
  },
  {
    title: "Exklusiva rabattkoder",
    body: "Koder som bara gäller via braerbjudanden.se, tydligt märkta som samarbete.",
  },
  {
    title: "Sponsrade kampanjplatser",
    body: "Betald synlighet är alltid märkt som Sponsrat. Sponsring påverkar aldrig Deal Score.",
  },
  {
    title: "Affiliate-partnerskap",
    body: "Vi spårar klick centralt via /go och behåller era befintliga affiliatelänkar.",
  },
  {
    title: "Nyhetsbrevssamarbeten",
    body: "Urval i vårt mailutskick när erbjudandet faktiskt är relevant för prenumeranterna.",
  },
];

export default function PartnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Partner"
        title="Samarbeta med braerbjudanden.se"
        description="Vi hjälper svenska butiker att nå shoppare som aktivt letar efter ett bra köp – utan spammy rabattkodsestetik."
        icon={Handshake}
      />
      <section className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div className="grid gap-4">
          {offerings.map((item) => (
            <article key={item.title} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="rounded-2xl bg-muted/40 p-6">
          <h2 className="text-lg font-semibold">Kontakta oss</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Berätta kort om butiken, kampanjen och tidsperioden. Vi återkommer om
            samarbetet passar sajten.
          </p>
          <Button asChild className="mt-4">
            <a href={`mailto:${siteConfig.contactEmail}`}>Mejla {siteConfig.contactEmail}</a>
          </Button>
        </div>
      </section>
    </>
  );
}
