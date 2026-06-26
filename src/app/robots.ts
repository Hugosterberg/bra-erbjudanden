import type { MetadataRoute } from "next";

import { createAbsoluteUrl } from "@/shared/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/go"],
    },
    sitemap: createAbsoluteUrl("/sitemap.xml"),
  };
}
