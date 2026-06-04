import { isStablecoinToken, type SendTokenConfig } from '~/constants/send-tokens';

export function formatTokenBalanceDisplay(token: SendTokenConfig, formatted: string): string {
  const value = Number(formatted);
  const display = Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: isStablecoinToken(token) ? 2 : 0,
        maximumFractionDigits: token.decimals,
      })
    : '0';

  if (token.amountPrefix) {
    return `${token.amountPrefix}${display}`;
  }
  return `${display} ${token.symbol}`;
}
