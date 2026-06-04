import { useCallback, useEffect, useState } from "react";

import {
  summarizeOracleCatalog,
  sortActiveOracles,
  type OracleCatalogSummary,
} from "~/lib/predict/oracle-catalog";
import { clearPredictPlayCache } from "~/lib/predict/predict-play-cache";
import {
  fetchOracleCatalogCached,
  fetchOracleStatesForOracles,
} from "~/lib/predict/predict-server";
import { alignStrikeToGrid } from "~/lib/predict/strike";
import type {
  PredictOracleListItem,
  PredictOracleStateResponse,
  PredictPlayCard,
} from "~/lib/predict/types";

function cardFromState(
  oracle: PredictOracleListItem,
  state: PredictOracleStateResponse
): PredictPlayCard {
  const spot = state.latest_price?.spot ?? 0;
  const forward = state.latest_price?.forward ?? spot;
  return {
    oracle,
    spot,
    forward,
    atmStrike: alignStrikeToGrid(spot, oracle.min_strike, oracle.tick_size),
    priceUpdatedAt: state.latest_price?.onchain_timestamp ?? Date.now(),
  };
}

export function usePredictPlayCards() {
  const [cards, setCards] = useState<PredictPlayCard[]>([]);
  const [catalog, setCatalog] = useState<OracleCatalogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { force?: boolean }) => {
    if (options?.force) clearPredictPlayCache();

    setIsLoading(true);
    setError(null);

    try {
      const nowMs = Date.now();
      const allOracles = await fetchOracleCatalogCached();

      setCatalog(summarizeOracleCatalog(allOracles, nowMs));
      const oracles = sortActiveOracles(allOracles, nowMs);

      if (oracles.length === 0) {
        setCards([]);
        return;
      }

      const states = await fetchOracleStatesForOracles(oracles);
      setCards(oracles.map((oracle, index) => cardFromState(oracle, states[index])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prediction markets");
      setCards([]);
      setCatalog(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    cards,
    catalog,
    isLoading,
    error,
    refetch: () => load({ force: true }),
  };
}
