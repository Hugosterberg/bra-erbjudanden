import type { Category } from "@/features/categories/types";
import type { Store } from "@/features/stores/types";
import type { Tables } from "@/shared/types/database";

export type Offer = Tables<"offers">;
export type OfferStatus = Offer["status"];
export type DiscountType = Offer["discount_type"];
export type RedemptionType = Offer["redemption_type"];

export type OfferWithRelations = Offer & {
  store: Pick<Store, "id" | "name" | "slug" | "logo_url" | "website_url"> | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  click_count?: number;
  website_click_count?: number;
  code_click_count?: number;
};

/** Offer titles are headings, so lists must adapt to the surrounding page. */
export type OfferHeadingLevel = "h2" | "h3";

export type OfferRedirectTarget = Pick<
  Offer,
  "id" | "affiliate_url" | "store_id" | "status" | "starts_at" | "ends_at"
>;
