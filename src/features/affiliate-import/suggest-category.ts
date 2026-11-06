/**
 * Suggests a category from feed text so imported offers reach the category
 * pages. Keywords are matched as whole words and an admin edit always wins.
 */
const CATEGORY_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: "elektronik",
    keywords: ["elektronik", "dator", "datorer", "laptop", "mobil", "mobiler", "tv", "hörlurar", "surfplatta", "gaming", "kamera", "smartklocka"],
  },
  {
    slug: "mode",
    keywords: ["mode", "kläder", "klänning", "jacka", "jackor", "skor", "sneakers", "accessoarer", "väskor", "smycken", "underkläder"],
  },
  {
    slug: "hem-inredning",
    keywords: ["inredning", "möbler", "soffa", "kök", "köksredskap", "belysning", "sängkläder", "trädgård", "hemma"],
  },
  {
    slug: "skonhet",
    keywords: ["skönhet", "smink", "hudvård", "parfym", "doft", "hårvård", "kosmetika", "serum"],
  },
  {
    slug: "halsa",
    keywords: ["hälsa", "vitaminer", "kosttillskott", "apotek", "egenvård", "kontaktlinser", "linser"],
  },
  {
    slug: "traning-sport",
    keywords: ["träning", "sport", "gym", "löpning", "cykel", "cyklar", "friluftsliv", "outdoor", "proteinpulver", "yoga"],
  },
  {
    slug: "barn-familj",
    keywords: ["barn", "bebis", "barnkläder", "leksaker", "barnvagn", "familj"],
  },
  {
    slug: "resor",
    keywords: ["resa", "resor", "hotell", "flyg", "flygresa", "semester", "hyrbil", "kryssning", "weekend"],
  },
  {
    slug: "mat",
    keywords: ["mat", "matkasse", "matkassar", "restaurang", "dagligvaror", "kaffe", "vin", "choklad", "godis"],
  },
  {
    slug: "tjanster",
    keywords: ["streaming", "abonnemang", "försäkring", "bredband", "mobilabonnemang", "vpn", "webbhotell", "prenumeration"],
  },
];

const WORD_BOUNDARY = "(?<![\\p{L}\\p{N}])";
const WORD_END = "(?![\\p{L}\\p{N}])";

const COMPILED = CATEGORY_KEYWORDS.map(({ slug, keywords }) => ({
  slug,
  pattern: new RegExp(`${WORD_BOUNDARY}(?:${keywords.join("|")})${WORD_END}`, "giu"),
}));

export function suggestCategorySlug(...sources: Array<string | null | undefined>) {
  const text = sources.filter(Boolean).join(" ");
  let best: { slug: string; hits: number } | null = null;

  for (const { slug, pattern } of COMPILED) {
    const hits = text.match(pattern)?.length ?? 0;
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { slug, hits };
    }
  }

  return best?.slug ?? null;
}
