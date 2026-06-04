import { useCallback, useEffect, useRef, useState } from "react";

import type { SendTokenConfig } from '~/constants/send-tokens';
import type { CoinBalance } from '~/lib/sui/balances';
import { fetchCoinBalance } from '~/lib/sui/balances';

const POLL_MS = 12_000;

export function useSendTokenBalance(
  address: string | null | undefined,
  token: SendTokenConfig
) {
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(
    async (silent = false) => {
      if (!address) {
        setBalance(null);
        setIsLoading(false);
        return;
      }

      if (!silent) setIsLoading(true);
      try {
        const next = await fetchCoinBalance(address, token.coinType, token.decimals);
        if (!mountedRef.current) return;
        setBalance(next);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load balance');
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [address, token.coinType, token.decimals]
  );

  useEffect(() => {
    mountedRef.current = true;
    void refetch(false);
    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      void refetch(true);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [address, refetch]);

  return { balance, isLoading, error, refetch: () => refetch(true) };
}
