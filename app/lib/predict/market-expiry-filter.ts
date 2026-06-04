import type { PredictOracleListItem } from '~/lib/predict/types';
import type { PredictPlayCard } from '~/lib/predict/types';

export type MarketExpiryFilter = 'all' | '10m' | '1h' | '12h' | '1d';

export const MARKET_EXPIRY_FILTERS: MarketExpiryFilter[] = [
  'all',
  '10m',
  '1h',
  '12h',
  '1d',
];

const MAX_MS: Record<Exclude<MarketExpiryFilter, 'all'>, number> = {
  '10m': 10 * 60_000,
  '1h': 60 * 60_000,
  '12h': 12 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

export function isTradeableOracle(oracle: PredictOracleListItem, nowMs = Date.now()): boolean {
  return oracle.status === 'active' && oracle.expiry > nowMs;
}

export function isTradeablePlayCard(card: PredictPlayCard, nowMs = Date.now()): boolean {
  return isTradeableOracle(card.oracle, nowMs);
}

export function marketTimeToExpiryMs(card: PredictPlayCard, now = Date.now()): number {
  return Math.max(0, card.oracle.expiry - now);
}

export function matchesMarketExpiryFilter(
  card: PredictPlayCard,
  filter: MarketExpiryFilter,
  now = Date.now()
): boolean {
  if (!isTradeablePlayCard(card, now)) {
    return false;
  }
  if (filter === 'all') {
    return true;
  }
  return marketTimeToExpiryMs(card, now) <= MAX_MS[filter];
}
