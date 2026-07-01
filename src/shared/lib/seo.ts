import type { Metadata } from "next";

import { siteConfig } from "@/shared/config/site";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  /** Use the full title as-is in <title>, bypassing the layout template. */
  absoluteTitle?: boolean;
};

export function createMetadata({
  title,
  description,
  path = "/",
  absoluteTitle = false,
}: SeoInput): Metadata {
  const url = createAbsoluteUrl(path);
  const fullTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle
      ? { absolute: fullTitle }
      : title === siteConfig.name
        ? { absolute: siteConfig.name }
        : title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export function createAbsoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createJsonLd(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: createAbsoluteUrl(item.path),
    })),
  };
}

type FaqEntry = {
  question: string;
  answer: string;
};

export function createFaqJsonLd(items: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
