import { Info } from "lucide-react";

import { createMetadata } from "@/shared/lib/seo";
import { CompanyDetails } from "@/shared/ui/company-details";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = createMetadata({
  title: "Om oss och kontakt",
  description:
    "Vem som står bakom braerbjudanden.se, hur vi väljer och rankar erbjudanden och hur du kontaktar oss.",
  path: "/om-oss",
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Om oss"
        title="Om braerbjudanden.se"
        description="Vi samlar rabatter, rabattkoder och kampanjer från svenska butiker och försöker vara tydliga med vad som faktiskt är ett bra erbjudande."
        icon={Info}
      />
      <section className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Så väljer vi erbjudanden</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Erbjudandena kommer från butiker vi samarbetar med och från de affiliatenätverk vi är
            anslutna till. En del lägger vi in själva, andra hämtas automatiskt och granskas innan
            de visas. Det står vid varje erbjudande när vi själva har kontrollerat det senast.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Så rankar vi</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Deal Score väger samman rabattens storlek, hur nyligen erbjudandet uppdaterats, om vi
            har kontrollerat det, hur besökare har svarat att koden fungerade, hur många som
            klickat, om vi valt ut det och hur snart det går ut. Standardsorteringen visar utvalda
            erbjudanden först och därefter vår manuella och automatiska rangordning. Sponsring och
            provision ger inga poäng, och sponsrade placeringar märks alltid.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Vem står bakom sajten</h2>
          <CompanyDetails />
        </div>
      </section>
    </>
  );
}
