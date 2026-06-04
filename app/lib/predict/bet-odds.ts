import type { DirectionalMintQuotes } from '~/lib/predict/trade-prices';

/** One-tap stake presets shown on market detail. */
export const MARKET_ONE_TAP_STAKES = [5, 25, 100] as const;
export type MarketOneTapStake = (typeof MARKET_ONE_TAP_STAKES)[number];

const FALLBACK_UP_CENTS = 50;
const FALLBACK_DOWN_CENTS = 50;

export function directionalOddsCents(isUp: boolean, quotes: DirectionalMintQuotes | null): number {
  if (!quotes) return FALLBACK_UP_CENTS;
  return isUp ? quotes.upAskCents : quotes.downAskCents;
}

/** Rough payout if the contract pays ~$1 per winning share at the displayed odds. */
export function estimatedWinUsd(stakeUsd: number, oddsCents: number): number {
  if (oddsCents <= 0) return stakeUsd;
  return stakeUsd / (oddsCents / 100);
}

export function formatWinUsd(amount: number, stakeUsd: number): string {
  if (stakeUsd >= 100) return amount.toFixed(0);
  if (stakeUsd >= 25) return amount.toFixed(0);
  return amount.toFixed(2).replace(/\.?0+$/, '') || amount.toFixed(2);
}
