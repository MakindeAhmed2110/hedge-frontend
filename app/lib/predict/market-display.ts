import { formatMarketWindowLabel } from '~/lib/predict/format';
import type { PredictPlayCard } from '~/lib/predict/types';
import { spotFromRaw } from '~/lib/predict/strike';
type ChartDataPoint = { value: number; timestamp: number };

/** Forward vs spot — price lean, not SVI-implied win probability. */
export function marketPriceLean(spotRaw: number, forwardRaw: number) {
  const spot = spotFromRaw(spotRaw);
  const forward = spotFromRaw(forwardRaw);
  if (spot <= 0) {
    return { isUp: true, deltaPct: 0 };
  }
  const deltaPct = ((forward - spot) / spot) * 100;
  return { isUp: forward >= spot, deltaPct };
}

export function marketListTitle(card: PredictPlayCard, windowLabel?: string): string {
  const asset = card.oracle.underlying_asset.toUpperCase();
  const window = windowLabel ?? formatMarketWindowLabel(card.oracle.expiry);
  const remainingMs = card.oracle.expiry - Date.now();

  if (remainingMs > 0 && remainingMs < 86_400_000) {
    return `${asset} Up or Down · ${window}`;
  }
  return `${asset} price prediction`;
}

export function marketSubtitle(card: PredictPlayCard): string {
  const spot = spotFromRaw(card.spot);
  return `ATM $${spot.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Lightweight sparkline for market detail chart. */
export function buildMarketChartSeries(card: PredictPlayCard, points = 48): ChartDataPoint[] {
  const spot = spotFromRaw(card.spot);
  const forward = spotFromRaw(card.forward);
  const now = Date.now();
  const start = spot * 0.996;
  const series: ChartDataPoint[] = [];

  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    const drift = start + (forward - start) * t;
    const wiggle = Math.sin(i * 0.55) * spot * 0.0012 + Math.cos(i * 0.31) * spot * 0.0008;
    series.push({
      value: drift + wiggle,
      timestamp: now - (points - i) * 5000,
    });
  }

  return series;
}

export function isCardPriceLoading(card: PredictPlayCard): boolean {
  return card.spot <= 0;
}

export function leanProbabilityPct(card: PredictPlayCard): number {
  const lean = marketPriceLean(card.spot, card.forward);
  const pct = Math.min(95, Math.max(5, 50 + lean.deltaPct * 8));
  return Math.round(lean.isUp ? pct : 100 - pct);
}
