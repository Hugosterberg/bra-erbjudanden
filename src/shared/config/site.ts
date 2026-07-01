function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

const productionUrl = "https://www.braerbjudanden.se";

function resolveSiteUrl() {
  // Treat unset AND empty env values as missing so canonicals never end up
  // pointing at a deployment preview host by accident.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return process.env.NODE_ENV === "production"
    ? productionUrl
    : "http://localhost:3000";
}

export const siteConfig = {
  name: "braerbjudanden.se",
  tagline: "Bra erbjudanden, rabattkoder och kampanjer i Sverige",
  url: normalizeSiteUrl(resolveSiteUrl()),
  description:
    "Hitta bra erbjudanden, rabatter och rabattkoder från svenska butiker. Handplockade kampanjer och deals – alltid aktiva, aldrig utgångna.",
  locale: "sv_SE",
  keywords: [
    "bra erbjudanden",
    "erbjudanden",
    "rabatter",
    "rabattkoder",
    "kampanjer",
    "deals",
    "rea",
    "spara pengar",
    "erbjudanden Sverige",
  ],
};
