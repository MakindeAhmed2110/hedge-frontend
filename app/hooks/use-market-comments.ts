import { useCallback, useEffect, useState } from "react";

import { fetchMarketComments } from "~/lib/predict/predict-server";
import type { MarketComment } from "~/lib/predict/types";

type UseMarketCommentsArgs = {
  oracleId: string;
  enabled?: boolean;
  pollMs?: number;
};

export function useMarketComments({
  oracleId,
  enabled = true,
  pollMs = 5000,
}: UseMarketCommentsArgs) {
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const rows = await fetchMarketComments(oracleId);
      setComments(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, oracleId]);

  useEffect(() => {
    if (!enabled) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, refresh]);

  return { comments, isLoading, error, refresh };
}
