import { DUSDC_DECIMALS } from '~/constants/sui';
import type { PredictManagerSummary } from '~/lib/predict/types';

const QUOTE_SCALE = 10 ** DUSDC_DECIMALS;

/** On-chain raw amount (6 decimals) held in the PredictManager. */
export function managerBalanceRaw(summary: PredictManagerSummary): bigint {
  const raw = summary.balances[0]?.balance ?? summary.trading_balance ?? 0;
  return BigInt(Math.max(0, Math.round(raw)));
}

export function managerBalanceUsd(summary: PredictManagerSummary): number {
  return Number(managerBalanceRaw(summary)) / QUOTE_SCALE;
}

export function usdToManagerBalanceRaw(usd: number): bigint {
  return BigInt(Math.round(usd * QUOTE_SCALE));
}

export function managerBalanceRawToUsd(raw: bigint): number {
  return Number(raw) / QUOTE_SCALE;
}

/** Display string for withdraw input (up to 6 decimals, no round-up). */
export function managerBalanceInputString(raw: bigint): string {
  if (raw <= 0n) {
    return '0';
  }
  const whole = raw / BigInt(QUOTE_SCALE);
  const fraction = raw % BigInt(QUOTE_SCALE);
  if (fraction === 0n) {
    return whole.toString();
  }
  const frac = fraction.toString().padStart(DUSDC_DECIMALS, '0').replace(/0+$/, '');
  return `${whole}.${frac}`;
}

export function parseManagerUsdInput(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (!trimmed) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

export function usdExceedsManagerBalance(usd: number, balanceRaw: bigint): boolean {
  return usdToManagerBalanceRaw(usd) > balanceRaw;
}
