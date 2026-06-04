import { isStablecoinToken } from '~/constants/send-tokens';
import type { TokenHolding } from '~/hooks/use-all-token-balances';
import type { ActivityTransaction } from '~/lib/sui/activity';

export const COINGECKO_SUI_USD_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd';

export function formatUsd(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `$${safe.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function holdingUsdValue(
  holding: TokenHolding,
  suiUsdPrice: number
): number {
  if (holding.amount <= 0) return 0;
  if (isStablecoinToken(holding.token)) {
    return holding.amount;
  }
  if (holding.token.id === 'sui' && suiUsdPrice > 0) {
    return holding.amount * suiUsdPrice;
  }
  return 0;
}

export function computePortfolioTotalUsd(
  holdings: TokenHolding[],
  suiUsdPrice: number
): number {
  return holdings.reduce((sum, holding) => sum + holdingUsdValue(holding, suiUsdPrice), 0);
}

export function transactionUsdDelta(
  tx: ActivityTransaction,
  suiUsdPrice: number
): number {
  const magnitude =
    tx.usdValue ?? (tx.symbol === 'SUI' && suiUsdPrice > 0 ? tx.amount * suiUsdPrice : 0);
  return tx.type === 'receive' ? magnitude : -magnitude;
}
