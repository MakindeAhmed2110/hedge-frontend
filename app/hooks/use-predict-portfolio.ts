import { useCallback, useEffect, useState } from 'react';

import {
  deriveManagerSummaryFromPositions,
  isMarkQuotePortfolioError,
} from '~/lib/predict/portfolio-fallback';
import { partitionOpenPositions } from '~/lib/predict/position-lifecycle';
import {
  fetchManagerPositionsSummary,
  fetchManagerSummary,
  findManagerForOwner,
} from '~/lib/predict/predict-server';
import type {
  PredictManagerListItem,
  PredictManagerSummary,
  PredictPositionSummary,
} from '~/lib/predict/types';

type UsePredictPortfolioArgs = {
  owner: string | null | undefined;
  managerId: string | null | undefined;
};

type RefreshOptions = {
  /** Skip full-screen loading state (for background sync after trades). */
  silent?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function positionMatches(
  a: PredictPositionSummary,
  b: Pick<PredictPositionSummary, 'oracle_id' | 'strike' | 'is_up'>
) {
  return a.oracle_id === b.oracle_id && a.strike === b.strike && a.is_up === b.is_up;
}

function isPositionClosedOnServer(
  list: PredictPositionSummary[],
  closed: PredictPositionSummary
) {
  const row = list.find((position) => positionMatches(position, closed));
  return row != null && row.open_quantity === 0;
}

export function usePredictPortfolio({ owner, managerId }: UsePredictPortfolioArgs) {
  const [managerRecord, setManagerRecord] = useState<PredictManagerListItem | null>(null);
  const [summary, setSummary] = useState<PredictManagerSummary | null>(null);
  const [positions, setPositions] = useState<PredictPositionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (!owner && !managerId) {
      return null;
    }

    let resolvedId = managerId ?? null;
    let record: PredictManagerListItem | null = null;

    if (owner) {
      record = await findManagerForOwner(owner);
      if (record) {
        resolvedId = record.manager_id;
        setManagerRecord(record);
      } else {
        setManagerRecord(null);
      }
    }

    if (!resolvedId) {
      return { summary: null, positions: [] as PredictPositionSummary[] };
    }

    const positionsResult = await fetchManagerPositionsSummary(resolvedId);

    try {
      const summaryResult = await fetchManagerSummary(resolvedId);
      return { summary: summaryResult, positions: positionsResult };
    } catch (summaryErr) {
      const message = summaryErr instanceof Error ? summaryErr.message : String(summaryErr);
      if (isMarkQuotePortfolioError(message) && positionsResult.length > 0) {
        return {
          summary: deriveManagerSummaryFromPositions(positionsResult, resolvedId),
          positions: positionsResult,
        };
      }
      if (isMarkQuotePortfolioError(message)) {
        return { summary: null, positions: positionsResult };
      }
      throw summaryErr;
    }
  }, [owner, managerId]);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!owner && !managerId) {
        setManagerRecord(null);
        setSummary(null);
        setPositions([]);
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }

      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await loadPortfolio();
        if (!result) {
          setSummary(null);
          setPositions([]);
          return;
        }
        setSummary(result.summary);
        setPositions(result.positions);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load Predict account';
        if (isMarkQuotePortfolioError(message)) {
          setError(null);
        } else {
          setError(message);
          setSummary(null);
          setPositions([]);
        }
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [owner, managerId, loadPortfolio]
  );

  const optimisticallyClosePosition = useCallback((closed: PredictPositionSummary) => {
    setPositions((prev) =>
      prev.map((position) =>
        positionMatches(position, closed)
          ? {
              ...position,
              open_quantity: 0,
              mark_value: 0,
              mark_price: null,
              unrealized_pnl: 0,
              status: 'redeemed',
            }
          : position
      )
    );
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            open_positions: Math.max(0, prev.open_positions - 1),
            unrealized_pnl: 0,
          }
        : prev
    );
  }, []);

  const syncAfterClose = useCallback(
    async (closed: PredictPositionSummary) => {
      setIsSyncing(true);
      try {
        const pollDelaysMs = [0, 900, 1800, 2800, 4000, 5500];
        for (const delayMs of pollDelaysMs) {
          if (delayMs > 0) {
            await sleep(delayMs);
          }
          try {
            const result = await loadPortfolio();
            if (!result) {
              continue;
            }
            setSummary(result.summary);
            setPositions(result.positions);
            if (isPositionClosedOnServer(result.positions, closed)) {
              return;
            }
          } catch {
            // Keep optimistic UI; try again on next interval.
          }
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [loadPortfolio]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { active: openPositions, expiredPendingClear } = partitionOpenPositions(positions);

  return {
    managerRecord,
    summary,
    positions,
    openPositions,
    expiredPendingClear,
    isLoading,
    isSyncing,
    error,
    refresh,
    optimisticallyClosePosition,
    syncAfterClose,
  };
}
