import { DUSDC_COIN_TYPE, SUI_COIN_TYPE } from '~/constants/sui';
import { rpcGetBalance } from '~/lib/sui/rpc';

export type CoinBalance = {
  amount: number;
  raw: bigint;
  formatted: string;
};

function formatCoinAmount(raw: bigint, decimals: number): { amount: number; formatted: string } {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const amount = Number(whole) + Number(fraction) / Number(divisor);
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  const formatted = fractionStr ? `${whole}.${fractionStr}` : whole.toString();
  return { amount, formatted };
}

export async function fetchCoinBalance(owner: string, coinType: string, decimals: number): Promise<CoinBalance> {
  const totalBalance = await rpcGetBalance(owner, coinType);
  const raw = BigInt(totalBalance);
  const { amount, formatted } = formatCoinAmount(raw, decimals);
  return { amount, raw, formatted };
}

/** @deprecated Use fetchCoinBalance */
export async function fetchDusdcBalance(owner: string): Promise<CoinBalance> {
  return fetchCoinBalance(owner, DUSDC_COIN_TYPE, 6);
}

export async function fetchSuiBalanceMist(owner: string): Promise<bigint> {
  const totalBalance = await rpcGetBalance(owner, SUI_COIN_TYPE);
  return BigInt(totalBalance);
}

export function parseAmountToRaw(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === '.') return 0n;

  const [wholePart, fractionPart = ''] = trimmed.split('.');
  const whole = BigInt(wholePart || '0');
  const fractionPadded = (fractionPart + '0'.repeat(decimals)).slice(0, decimals);
  const fraction = BigInt(fractionPadded || '0');
  const scale = 10n ** BigInt(decimals);
  return whole * scale + fraction;
}

/** @deprecated Use parseAmountToRaw */
export function parseDusdcAmountToRaw(amount: string): bigint {
  return parseAmountToRaw(amount, 6);
}
