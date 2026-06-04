import { useMemo } from 'react';

import {
  buildUsdBalanceSeriesWithTimestamps,
  computeSeriesChange,
  isFlatBalanceChart,
  type BalanceChartPoint,
  type ChartPeriod,
} from '~/lib/portfolio/balance-history';
import { formatUsd } from '~/lib/portfolio/usd-value';
import type { ActivityTransaction } from '~/lib/sui/activity';

function formatUsdChange(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatUsd(Math.abs(amount))}`;
}

function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

type UsePortfolioUsdChartArgs = {
  period: ChartPeriod;
  currentUsdTotal: number;
  transactions: ActivityTransaction[];
  suiUsdPrice: number;
  isLoading?: boolean;
};

export function usePortfolioUsdChart({
  period,
  currentUsdTotal,
  transactions,
  suiUsdPrice,
  isLoading = false,
}: UsePortfolioUsdChartArgs) {
  const chartData = useMemo<BalanceChartPoint[]>(
    () =>
      buildUsdBalanceSeriesWithTimestamps(
        currentUsdTotal,
        transactions,
        period,
        suiUsdPrice
      ),
    [currentUsdTotal, transactions, period, suiUsdPrice]
  );

  const { changeAmount, changePercent, isPositive } = useMemo(
    () => computeSeriesChange(chartData),
    [chartData]
  );

  const isCompactChart = useMemo(
    () => isFlatBalanceChart(currentUsdTotal, chartData),
    [currentUsdTotal, chartData]
  );

  return {
    chartData,
    changeAmount: formatUsdChange(changeAmount),
    changePercent: formatChangePercent(changePercent),
    isPositive,
    isLoading,
    isCompactChart,
    formatChartValue: formatUsd,
  };
}
