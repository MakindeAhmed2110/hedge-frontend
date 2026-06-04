import { useMemo } from 'react';

import { SEND_TOKEN_LIST, SEND_TOKENS, type SendTokenConfig } from '~/constants/send-tokens';
import { useSendTokenBalance } from '~/hooks/use-send-token-balance';
import { formatTokenBalanceDisplay } from '~/lib/portfolio/format-balance';
import type { CoinBalance } from '~/lib/sui/balances';

export type TokenHolding = {
  token: SendTokenConfig;
  balanceDisplay: string;
  amount: number;
};

export function useAllTokenBalances(address: string | null | undefined) {
  const dusdc = useSendTokenBalance(address, SEND_TOKENS.dusdc);
  const dbusdc = useSendTokenBalance(address, SEND_TOKENS.dbusdc);
  const sui = useSendTokenBalance(address, SEND_TOKENS.sui);

  const balancesById = useMemo(
    () =>
      ({
        dusdc: dusdc.balance,
        dbusdc: dbusdc.balance,
        sui: sui.balance,
      }) as Record<SendTokenConfig['id'], CoinBalance | null>,
    [dusdc.balance, dbusdc.balance, sui.balance]
  );

  const holdings = useMemo<TokenHolding[]>(() => {
    const items = SEND_TOKEN_LIST.map((token) => {
      const balance = balancesById[token.id];
      const formatted = balance?.formatted ?? '0';
      return {
        token,
        balanceDisplay: formatTokenBalanceDisplay(token, formatted),
        amount: balance?.amount ?? 0,
      };
    });

    const listOrder = new Map(SEND_TOKEN_LIST.map((token, index) => [token.id, index]));

    return items.sort((a, b) => {
      const aFunded = a.amount > 0;
      const bFunded = b.amount > 0;
      if (aFunded !== bFunded) {
        return aFunded ? -1 : 1;
      }
      if (aFunded && bFunded && a.amount !== b.amount) {
        return b.amount - a.amount;
      }
      return (listOrder.get(a.token.id) ?? 0) - (listOrder.get(b.token.id) ?? 0);
    });
  }, [balancesById]);

  return {
    holdings,
    isLoading: dusdc.isLoading || dbusdc.isLoading || sui.isLoading,
  };
}
