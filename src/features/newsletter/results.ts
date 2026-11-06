/** Outcomes of an admin action, passed in the URL so they survive the redirect. */
export const NEWSLETTER_RESULTS = {
  klart: { ok: true, message: "Utskicket är klart." },
  pausad: {
    ok: true,
    message: "Tidsgränsen nåddes. Tryck på Fortsätt skicka för att skicka till resten.",
  },
  "test-skickat": { ok: true, message: "Testmejlet skickades. Kontrollera innehåll och länkar." },
  "bekraftelser-skickade": {
    ok: true,
    message: "Bekräftelser har skickats, upp till 200 åt gången. Tryck igen om fler väntar.",
  },
  "test-fel": { ok: false, message: "Testmejlet kunde inte skickas. Kontrollera adressen och Resend." },
  fel: {
    ok: false,
    message: "Utskicket stannade på grund av ett fel. Tryck på Fortsätt skicka för att försöka igen.",
  },
  "ej-konfigurerad": { ok: false, message: "E-post är inte kopplad." },
  "redan-skickat": { ok: false, message: "Utskicket finns inte eller är redan skickat." },
  "inga-erbjudanden": {
    ok: false,
    message: "Inget av erbjudandena i utskicket är aktivt längre. Skapa ett nytt utskick.",
  },
  "inga-prenumeranter": { ok: false, message: "Det finns inga bekräftade prenumeranter ännu." },
} as const;

export type NewsletterResult = keyof typeof NEWSLETTER_RESULTS;

export function readNewsletterResult(value: string | undefined) {
  return value && Object.hasOwn(NEWSLETTER_RESULTS, value)
    ? NEWSLETTER_RESULTS[value as NewsletterResult]
    : null;
}
