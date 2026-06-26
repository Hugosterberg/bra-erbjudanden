function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "braerbjudanden.se",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  description:
    "Handplockade erbjudanden, rabattkoder och kampanjer för svenska konsumenter.",
  locale: "sv_SE",
};
