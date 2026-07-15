export const AFFILIATE_NETWORKS = [
  "addrevenue",
  "adtraction",
  "adrecord",
  "awin",
  "tradedoubler",
] as const;

export type AffiliateNetwork = (typeof AFFILIATE_NETWORKS)[number];

export type ImportedStoreDraft = {
  externalId: string;
  name: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
};

export type ImportedOfferDraft = {
  externalId: string;
  network: AffiliateNetwork;
  title: string;
  description: string;
  store: ImportedStoreDraft;
  redemptionType: "discount_code" | "direct_link";
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  discountCode?: string | null;
  affiliateUrl: string;
  terms?: string | null;
  imageUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type NetworkImportResult = {
  network: AffiliateNetwork;
  fetched: number;
  created: number;
  updated: number;
  archived: number;
  skipped: number;
  errors: string[];
};

export type ImportRunStats = {
  totals: {
    fetched: number;
    created: number;
    updated: number;
    archived: number;
    skipped: number;
  };
  networks: NetworkImportResult[];
};

export type AffiliateAdapter = {
  network: AffiliateNetwork;
  isConfigured: () => boolean;
  fetchOffers: () => Promise<ImportedOfferDraft[]>;
};
