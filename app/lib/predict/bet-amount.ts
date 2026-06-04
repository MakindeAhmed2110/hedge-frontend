import { DUSDC_DECIMALS } from '~/constants/sui';
import {
  BET_AMOUNT_QUICK_USD,
  MAX_BET_USD,
  MIN_BET_USD,
} from '~/constants/predict';

export type BetAmountErrorCode = 'invalid' | 'belowMin' | 'aboveMax' | 'insufficient';

const SCALE = 10 ** DUSDC_DECIMALS;

export function parseBetAmountInput(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export function validateBetAmountUsd(
  amountUsd: number,
  walletBalanceUsd?: number | null
): BetAmountErrorCode | null {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return 'invalid';
  }
  if (amountUsd < MIN_BET_USD) {
    return 'belowMin';
  }
  if (amountUsd > MAX_BET_USD) {
    return 'aboveMax';
  }
  if (walletBalanceUsd != null && amountUsd > walletBalanceUsd + 1e-9) {
    return 'insufficient';
  }
  return null;
}

export function walletBalanceToUsd(balanceRaw: string | bigint | null | undefined): number {
  if (balanceRaw == null) return 0;
  const raw = typeof balanceRaw === 'bigint' ? balanceRaw : BigInt(balanceRaw);
  return Number(raw) / SCALE;
}

export function getMaxAffordableBetUsd(walletBalanceUsd: number): number {
  return Math.min(
    MAX_BET_USD,
    Math.max(0, Math.floor(walletBalanceUsd * 100) / 100)
  );
}

export function getQuickBetAmounts(walletBalanceUsd: number): number[] {
  const maxAffordable = getMaxAffordableBetUsd(walletBalanceUsd);
  if (maxAffordable < MIN_BET_USD) {
    return [];
  }

  const amounts = new Set<number>();
  for (const value of BET_AMOUNT_QUICK_USD) {
    if (value >= MIN_BET_USD && value <= maxAffordable) {
      amounts.add(value);
    }
  }

  return Array.from(amounts).sort((a, b) => a - b);
}
