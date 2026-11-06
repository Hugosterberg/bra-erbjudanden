import { ShieldCheck } from "lucide-react";

import { siteConfig } from "@/shared/config/site";
import { createMetadata } from "@/shared/lib/seo";
import { CompanyDetails } from "@/shared/ui/company-details";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = createMetadata({
  title: "Integritetspolicy och cookies",
  description:
    "Vilka personuppgifter braerbjudanden.se behandlar, varför, hur länge och vilka rättigheter du har.",
  path: "/integritetspolicy",
});

const sections = [
  {
    title: "Nyhetsbrevet",
    body: [
      "När du skriver upp dig sparar vi din e-postadress, valda intressen, var på sajten du anmälde dig och när du gav ditt samtycke. Du får ett mejl där du bekräftar adressen innan vi skickar något annat.",
      "Den rättsliga grunden är ditt samtycke. Du kan när som helst återkalla det via länken i varje mejl. Vi behåller adressen så länge du prenumererar. Efter en avregistrering sparar vi den bara för att kunna visa att du har avslutat, tills du ber oss radera den.",
      "Mejlen skickas via vår e-postleverantör Resend, som behandlar adressen för vår räkning.",
    ],
  },
  {
    title: "Klick på länkar till butiker",
    body: [
      "När du klickar vidare till en butik sparar vi tidpunkt, vilket erbjudande det gäller, sidan du kom från, din webbläsares user-agent och ett saltat hashvärde av din IP-adress. Vi skapar också ett slumpmässigt klick-id som följer med till affiliatenätverket, så att vi kan se vilket erbjudande ett köp kom från utan att veta vem du är.",
      "Den rättsliga grunden är vårt berättigade intresse av att mäta sajten, förhindra missbruk och kunna redovisa provision. Ett hashvärde av en IP-adress kan fortfarande vara en personuppgift, och därför tar vi upp det här.",
      "Efter 90 dagar tar vi bort hashvärdet och user-agent från klicket. Själva klicket sparas sedan utan dem, eftersom vi behöver det för att stämma av provision.",
    ],
  },
  {
    title: "Sidvisningar, sökningar och omdömen",
    body: [
      "Vi mäter också visningar av erbjudanden, kopierade rabattkoder och vad som söks på sajten, tillsammans med ett saltat hashvärde av IP-adressen. Skriv därför inga personuppgifter i sökrutan. Hashvärdet tas bort efter 90 dagar och händelserna raderas efter 13 månader. Den rättsliga grunden är vårt berättigade intresse av att förbättra sajten.",
      "Om du svarar på om en rabattkod fungerade sparar vi svaret med ett saltat hashvärde av IP-adressen, så att varje besökare bara räknas en gång per kod. Svaret sparas så länge erbjudandet finns kvar.",
    ],
  },
  {
    title: "Butiker och affiliatenätverk",
    body: [
      "När du lämnar sajten via en annonslänk passerar du affiliatenätverket och butiken. De kan sätta egna cookies för att kunna registrera ditt köp och betala provision till oss, och de ansvarar själva för den behandlingen. Vi får inte veta vem du är eller vad du köpt, utan bara att ett köp gjorts och vilken provision det gav.",
    ],
  },
  {
    title: "Cookies och statistik",
    body: [
      "Vi sätter inga cookies för reklam på den här sajten. Vi sparar ditt val av ljust eller mörkt läge i en cookie, och administratörer har en inloggningscookie. Besöksstatistik samlas in med Vercel Web Analytics, som enligt leverantören fungerar utan cookies och utan att identifiera enskilda besökare.",
      "Butikslogotyper från affiliatenätverk kan laddas direkt från nätverkets eller butikens server, som då ser din IP-adress på samma sätt som vid vilken bild på webben som helst.",
    ],
  },
  {
    title: "Dina rättigheter",
    body: [
      "Du har rätt att begära tillgång till, rättelse eller radering av dina uppgifter, att invända mot behandling som grundas på berättigat intresse och att återkalla samtycke. Du kan också klaga hos Integritetsskyddsmyndigheten (IMY). Vi lagrar uppgifter hos våra leverantörer Supabase och Vercel.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Integritet"
        title="Integritetspolicy och cookies"
        description="Vi samlar in så lite som möjligt. Här står vad vi sparar, varför och hur du bestämmer över dina uppgifter."
        icon={ShieldCheck}
      />
      <section className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Personuppgiftsansvarig</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Frågor om dina uppgifter skickas till {siteConfig.contactEmail}.
          </p>
          <CompanyDetails />
        </div>
      </section>
    </>
  );
}
