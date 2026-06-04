import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchSuiActivity,
  groupActivityByDate,
  type ActivitySection,
  type ActivityTransaction,
} from '~/lib/sui/activity';

const POLL_MS = 8_000;

export function useSuiActivity(address: string | null | undefined) {
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(
    async (silent = false) => {
      if (!address) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      if (!silent) setIsLoading(true);
      try {
        const next = await fetchSuiActivity(address);
        if (!mountedRef.current) return;
        setTransactions(next);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [address]
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

  const sections = useMemo<ActivitySection[]>(
    () => groupActivityByDate(transactions),
    [transactions]
  );

  return {
    transactions,
    sections,
    isLoading,
    error,
    refetch: () => refetch(true),
  };
}
