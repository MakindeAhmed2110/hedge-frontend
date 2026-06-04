import { transactionUsdDelta } from '~/lib/portfolio/usd-value';
import type { ActivityTransaction } from '~/lib/sui/activity';

export const CHART_PERIODS = ['1H', '1D', '1W', '1M', '1Y', 'All'] as const;
export type ChartPeriod = (typeof CHART_PERIODS)[number];

const PERIOD_MS: Record<Exclude<ChartPeriod, 'All'>, number> = {
  '1H': 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
};

export const CHART_POINT_COUNT = 48;

export function periodStartMs(period: ChartPeriod, now = Date.now()): number {
  if (period === 'All') return 0;
  return now - PERIOD_MS[period];
}

export type BalanceChartPoint = { value: number; timestamp: number };

type BalanceKnot = { t: number; v: number };

function resampleKnots(
  knots: BalanceKnot[],
  startMs: number,
  endMs: number,
  count: number,
  fallback: number
): BalanceChartPoint[] {
  if (count < 2) {
    const now = endMs > 0 ? endMs : Date.now();
    return [
      { value: fallback, timestamp: startMs > 0 ? startMs : now },
      { value: fallback, timestamp: now },
    ];
  }

  if (endMs <= startMs || knots.length === 0) {
    return Array.from({ length: count }, (_, i) => ({
      value: fallback,
      timestamp: startMs + ((endMs - startMs) * i) / (count - 1),
    }));
  }

  const points: BalanceChartPoint[] = [];
  let knotIndex = 0;

  for (let i = 0; i < count; i++) {
    const t =
      count === 1 ? startMs : startMs + ((endMs - startMs) * i) / (count - 1);

    while (knotIndex < knots.length - 1 && knots[knotIndex + 1].t < t) {
      knotIndex += 1;
    }

    if (knotIndex >= knots.length - 1) {
      points.push({ value: knots[knots.length - 1].v, timestamp: t });
      continue;
    }

    const a = knots[knotIndex];
    const b = knots[knotIndex + 1];

    if (b.t <= a.t) {
      points.push({ value: b.v, timestamp: t });
      continue;
    }

    const ratio = (t - a.t) / (b.t - a.t);
    points.push({ value: a.v + (b.v - a.v) * ratio, timestamp: t });
  }

  return points;
}

/** Reconstruct token balance over time from activity + current balance. */
export function buildBalanceSeriesWithTimestamps(
  tokenSymbol: string,
  currentBalance: number,
  transactions: ActivityTransaction[],
  period: ChartPeriod,
  pointCount = CHART_POINT_COUNT
): BalanceChartPoint[] {
  const now = Date.now();
  const startMs = periodStartMs(period, now);

  const tokenTxs = transactions
    .filter((tx) => tx.symbol === tokenSymbol)
    .sort((a, b) => a.timestamp - b.timestamp);

  const txsInPeriod = tokenTxs.filter((tx) => tx.timestamp >= startMs);

  let netInPeriod = 0;
  for (const tx of txsInPeriod) {
    if (tx.type === 'receive') netInPeriod += tx.amount;
    else netInPeriod -= tx.amount;
  }

  const balanceAtPeriodStart = currentBalance - netInPeriod;
  const periodStartBalance =
    txsInPeriod.length > 0 || period === 'All'
      ? balanceAtPeriodStart
      : currentBalance;

  const knots: BalanceKnot[] = [
    { t: startMs > 0 ? startMs : tokenTxs[0]?.timestamp ?? now, v: periodStartBalance },
  ];

  let running = periodStartBalance;
  for (const tx of txsInPeriod) {
    if (tx.type === 'receive') running += tx.amount;
    else running -= tx.amount;
    knots.push({ t: tx.timestamp, v: running });
  }

  if (knots[knots.length - 1].t < now || knots[knots.length - 1].v !== currentBalance) {
    knots.push({ t: now, v: currentBalance });
  }

  return resampleKnots(knots, startMs > 0 ? startMs : knots[0].t, now, pointCount, currentBalance);
}

/** Reconstruct total portfolio USD over time from activity + current USD total. */
export function buildUsdBalanceSeriesWithTimestamps(
  currentUsdTotal: number,
  transactions: ActivityTransaction[],
  period: ChartPeriod,
  suiUsdPrice: number,
  pointCount = CHART_POINT_COUNT
): BalanceChartPoint[] {
  const now = Date.now();
  const startMs = periodStartMs(period, now);

  const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
  const txsInPeriod = sorted.filter((tx) => tx.timestamp >= startMs);

  let netInPeriod = 0;
  for (const tx of txsInPeriod) {
    netInPeriod += transactionUsdDelta(tx, suiUsdPrice);
  }

  const balanceAtPeriodStart = currentUsdTotal - netInPeriod;
  const periodStartBalance =
    txsInPeriod.length > 0 || period === 'All'
      ? balanceAtPeriodStart
      : currentUsdTotal;

  const knots: BalanceKnot[] = [
    {
      t: startMs > 0 ? startMs : sorted[0]?.timestamp ?? now,
      v: periodStartBalance,
    },
  ];

  let running = periodStartBalance;
  for (const tx of txsInPeriod) {
    running += transactionUsdDelta(tx, suiUsdPrice);
    knots.push({ t: tx.timestamp, v: running });
  }

  if (knots[knots.length - 1].t < now || knots[knots.length - 1].v !== currentUsdTotal) {
    knots.push({ t: now, v: currentUsdTotal });
  }

  return resampleKnots(
    knots,
    startMs > 0 ? startMs : knots[0].t,
    now,
    pointCount,
    currentUsdTotal
  );
}

/** Numeric values only (legacy / simple consumers). */
export function buildBalanceSeries(
  tokenSymbol: string,
  currentBalance: number,
  transactions: ActivityTransaction[],
  period: ChartPeriod,
  pointCount = CHART_POINT_COUNT
): number[] {
  return buildBalanceSeriesWithTimestamps(
    tokenSymbol,
    currentBalance,
    transactions,
    period,
    pointCount
  ).map((point) => point.value);
}

const FLAT_EPSILON = 1e-9;

/** True when balance is zero or the series has no movement in the selected period. */
export function isFlatBalanceChart(
  currentBalance: number,
  series: BalanceChartPoint[]
): boolean {
  if (currentBalance === 0) return true;
  if (series.length === 0) return true;

  const values = series.map((point) => point.value);
  const first = values[0];
  return values.every((value) => Math.abs(value - first) < FLAT_EPSILON);
}

export const CHART_HEIGHT_FULL = 152;
export const CHART_HEIGHT_COMPACT = 48;

export function computeSeriesChange(
  series: number[] | BalanceChartPoint[]
): {
  changeAmount: number;
  changePercent: number;
  isPositive: boolean;
} {
  if (series.length < 2) {
    return { changeAmount: 0, changePercent: 0, isPositive: true };
  }

  const values = series.map((item) => (typeof item === 'number' ? item : item.value));
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const changeAmount = endValue - startValue;
  const changePercent =
    startValue === 0 ? (endValue === 0 ? 0 : 100) : (changeAmount / startValue) * 100;
  const isPositive = changeAmount >= 0;

  return { changeAmount, changePercent, isPositive };
}
