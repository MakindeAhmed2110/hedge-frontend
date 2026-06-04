import { PREDICT_GAS_BUDGET } from '~/constants/predict';
import { fetchSuiBalanceMist } from '~/lib/sui/balances';

export { PREDICT_GAS_BUDGET as MIN_SUI_GAS_MIST };

export async function fetchTotalSuiMist(owner: string): Promise<bigint> {
  return fetchSuiBalanceMist(owner);
}

export async function hasTestnetSuiGas(owner: string): Promise<boolean> {
  const mist = await fetchTotalSuiMist(owner);
  return mist >= PREDICT_GAS_BUDGET;
}

export function isNoSuiGasError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('testnet SUI for gas') ||
    message.includes('NO_SUI_GAS') ||
    message.includes('INSUFFICIENT_SUI_GAS') ||
    message.includes('Balance of gas object') ||
    message.includes('lower than the needed amount') ||
    (err instanceof Error &&
      'code' in err &&
      ((err as { code?: string }).code === 'NO_SUI_GAS' ||
        (err as { code?: string }).code === 'INSUFFICIENT_SUI_GAS'))
  );
}
