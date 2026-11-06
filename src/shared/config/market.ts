/**
 * Everything that differs between country sites lives here. Adding a market
 * means adding an entry and pointing a domain at it with NEXT_PUBLIC_MARKET.
 */
export type MarketCode = "SE";

export type Market = {
  code: MarketCode;
  locale: string;
  languageCode: string;
  currency: string;
  currencyLabel: string;
};

const MARKETS: Record<MarketCode, Market> = {
  SE: {
    code: "SE",
    locale: "sv-SE",
    languageCode: "sv",
    currency: "SEK",
    currencyLabel: "kr",
  },
};

function resolveMarket(): Market {
  const code = process.env.NEXT_PUBLIC_MARKET?.trim().toUpperCase();
  return code && code in MARKETS ? MARKETS[code as MarketCode] : MARKETS.SE;
}

export const currentMarket = resolveMarket();
