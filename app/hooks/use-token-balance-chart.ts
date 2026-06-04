import { useMemo } from 'react';

import { isStablecoinToken, type SendTokenConfig } from '~/constants/send-tokens';
import {
  buildBalanceSeriesWithTimestamps,
  computeSeriesChange,
  isFlatBalanceChart,
  type BalanceChartPoint,
  type ChartPeriod,
} from '~/lib/portfolio/balance-history';
import type { ActivityTransaction } from '~/lib/sui/activity';

function formatChangeAmount(amount: number, token: SendTokenConfig): string {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: isStablecoinToken(token) ? 2 : 0,
    maximumFractionDigits: isStablecoinToken(token) ? 2 : Math.min(token.decimals, 4),
  });

  if (token.amountPrefix) {
    return `${sign}${token.amountPrefix}${formatted}`;
  }
  return `${sign}${formatted}`;
}

function formatChartValue(amount: number, token: SendTokenConfig): string {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: isStablecoinToken(token) ? 2 : 0,
    maximumFractionDigits: isStablecoinToken(token) ? 2 : Math.min(token.decimals, 4),
  });

  if (token.amountPrefix) {
    return `${token.amountPrefix}${formatted}`;
  }
  return `${formatted} ${token.symbol}`;
}

function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

type UseTokenBalanceChartArgs = {
  token: SendTokenConfig;
  period: ChartPeriod;
  currentAmount: number;
  transactions: ActivityTransaction[];
  isLoading?: boolean;
};

export function useTokenBalanceChart({
  token,
  period,
  currentAmount,
  transactions,
  isLoading = false,
}: UseTokenBalanceChartArgs) {
  const chartData = useMemo<BalanceChartPoint[]>(
    () => buildBalanceSeriesWithTimestamps(token.symbol, currentAmount, transactions, period),
    [token.symbol, currentAmount, transactions, period]
  );

  const { changeAmount, changePercent, isPositive } = useMemo(
    () => computeSeriesChange(chartData),
    [chartData]
  );

  const formatChartValueFn = useMemo(
    () => (value: number) => formatChartValue(value, token),
    [token]
  );

  const isCompactChart = useMemo(
    () => isFlatBalanceChart(currentAmount, chartData),
    [currentAmount, chartData]
  );

  return {
    chartData,
    changeAmount: formatChangeAmount(changeAmount, token),
    changePercent: formatChangePercent(changePercent),
    isPositive,
    isLoading,
    isCompactChart,
    formatChartValue: formatChartValueFn,
  };
}
