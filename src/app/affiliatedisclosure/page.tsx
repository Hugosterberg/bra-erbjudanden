import { createMetadata } from "@/shared/lib/seo";
import { AffiliateDisclosureBadge } from "@/features/monetization/components/affiliate-disclosure-badge";

export const metadata = createMetadata({
  title: "Affiliatedisclosure - Hur vi tjänar pengar",
  description:
    "Transparens om hur braerbjudanden.se tjänar pengar genom affiliatelänkar och sponsorships. Vi är öppna om vår affärsmodell.",
  path: "/affiliatedisclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Affiliatedisclosure</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
          Vi är öppna om hur vi tjänar pengar och vi bryr oss om din tillit.
        </p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Vad är affiliatelänkar?</h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              När du klickar på ett erbjudande på braerbjudanden.se och gör ett köp hos butiken, tjänar vi en liten
              provision från butiken eller affiliatenätverket. Detta påverkar INTE priset du betalar — du betalar exakt
              samma pris som om du hade gått direkt till butiken.
            </p>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Affiliatelänkar är märkta med en &quot;Affiliate&quot;-badge för full transparens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Hur använder vi affiliatelänkarna?
            </h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Pengarna vi tjänar använder vi till att:
            </p>
            <ul className="mt-3 space-y-2 text-neutral-700 dark:text-neutral-300">
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Hålla sajten snabb och uppdaterad</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Importera tusentals nya erbjudanden automatiskt varje dag</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Hålla sajten fri från invaderade popups och skräpigt UI</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Utveckla nya funktioner och förbättringar</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Vilka affiliate-nätverk använder vi?</h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Vi arbetar med de största och mest pålitliga affiliatenätverken i Sverige:
            </p>
            <ul className="mt-3 space-y-2 text-neutral-700 dark:text-neutral-300">
              <li>
                <strong>Awin</strong> — Världens största affiliatenätverk
              </li>
              <li>
                <strong>Adtraction</strong> — Ledande i Norden
              </li>
              <li>
                <strong>Tradedoubler</strong> — Stark fokus på skandinaviska varumärken
              </li>
              <li>
                <strong>Adrecord</strong> — Specialiserad på rabattkoder och kampanjer
              </li>
              <li>
                <strong>Addrevenue</strong> — Fokus på performance-baserade erbjudanden
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Sponsored offers (sponsrade erbjudanden)</h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Ibland kan en butik välja att betala extra för att få sitt erbjudande framhävt. Dessa erbjudanden märks tydligt som
              &quot;Sponsored&quot; så du vet att det är en betald placering.
            </p>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Sponsrade erbjudanden väljs aldrig bara för pengars skull — vi visar bara relevanta och värdefulla erbjudanden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Kan du lita på oss?</h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Vi förstår att affiliatelänkar kan skapa misstro. Vi är därför helt transparenta:
            </p>
            <ul className="mt-3 space-y-2 text-neutral-700 dark:text-neutral-300">
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Vi visar aldrig fejkade eller misledande rabatter</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Alla erbjudanden verifieras innan vi visar dem</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Vi visar utgångna erbjudanden aldrig som aktiva</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Varje erbjudande märks tydligt som affiliate</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Du betalar aldrig mer genom att klicka på våra länkar</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">FTC och EFTA Compliance</h2>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300">
              Vi följer strikt{" "}
              <a href="https://www.ftc.gov/news-events/news/2023/10/ftc-releases-revised-endorsement-guides-era-influencer-marketing-ai-generated-content"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                FTC:s riktlinjer för endorsements
              </a>
              {" "}och svenska{" "}
              <a href="https://www.mfr.se/"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Marknadsföringsrådets regler
              </a>
              . Affiliate-relationer är alltid tydligt märkta.
            </p>
          </section>

          <section className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Har du frågor?</h2>
            <p className="mt-2 text-blue-900 dark:text-blue-100">
              Vi tror på transparens och öppenhet. Kontakta oss på{" "}
              <a href="mailto:hello@braerbjudanden.se" className="font-semibold underline hover:opacity-75">
                hello@braerbjudanden.se
              </a>
              {" "}om du har fler frågor om hur vi tjänar pengar eller något annat om sajten.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <AffiliateDisclosureBadge />
        </div>
      </div>
    </main>
  );
}
