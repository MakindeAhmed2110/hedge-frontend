import type { PredictPlayCard } from "~/lib/predict/types";

/** Nearest-expiring BTC market, or nearest overall if none. */
export function pickFeaturedMarket(cards: PredictPlayCard[]): PredictPlayCard | null {
  if (cards.length === 0) return null;

  const btc = cards.filter((card) => card.oracle.underlying_asset.toUpperCase() === "BTC");
  return btc[0] ?? cards[0];
}

export function excludeFeaturedMarket(
  cards: PredictPlayCard[],
  featured: PredictPlayCard | null
): PredictPlayCard[] {
  if (!featured) return cards;
  return cards.filter((card) => card.oracle.oracle_id !== featured.oracle.oracle_id);
}
