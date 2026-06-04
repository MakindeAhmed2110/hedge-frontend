import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import {
  fetchHedgeMe,
  fetchHedgePoints,
  HedgeApiError,
} from "~/lib/hedge/hedge-api-fetch";
import type { HedgePointsSummary } from "~/lib/hedge/types";

async function loadPointsSummary(accessToken: string): Promise<HedgePointsSummary> {
  try {
    return await fetchHedgePoints(accessToken);
  } catch (err) {
    if (err instanceof HedgeApiError && err.status === 404) {
      throw new Error("Complete registration to view points.");
    }
    if (err instanceof HedgeApiError && err.status >= 500) {
      const me = await fetchHedgeMe(accessToken);
      return {
        totalPoints: me.stats.totalPoints,
        weeklyPoints: me.stats.weekPoints,
        weeklySummary: [],
      };
    }
    throw err;
  }
}

export function useHedgePoints() {
  const { getAccessToken, authenticated } = usePrivy();
  const [data, setData] = useState<HedgePointsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authenticated) {
      setIsLoading(false);
      setError("Sign in to view points.");
      return;
    }
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in to view points.");
      const summary = await loadPointsSummary(token);
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load points");
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
