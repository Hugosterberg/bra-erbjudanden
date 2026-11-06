import { SeasonalPageView } from "@/features/seasonal/components/seasonal-page-view";
import { SEASONAL_PAGES } from "@/features/seasonal/pages";
import { createMetadata } from "@/shared/lib/seo";

export const revalidate = 300;

const page = SEASONAL_PAGES["black-friday"];

export const metadata = createMetadata({
  title: page.metaTitle,
  description: page.description,
  path: page.path,
});

export default function BlackFridayPage() {
  return <SeasonalPageView page={page} />;
}
