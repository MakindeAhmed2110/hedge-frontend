import { useCallback, useEffect, useRef, useState } from "react";

import {
  summarizeOracleCatalog,
  sortActiveOracles,
  type OracleCatalogSummary,
} from "~/lib/predict/oracle-catalog";
import { clearPredictPlayCache, getCachedOracleCatalog, getStaleOracleCatalog } from "~/lib/predict/predict-play-cache";
import {
  fetchOracleCatalogCached,
  fetchOracleState,
  fallbackOracleState,
} from "~/lib/predict/predict-server";
import { alignStrikeToGrid } from "~/lib/predict/strike";
import type {
  PredictOracleListItem,
  PredictOracleStateResponse,
  PredictPlayCard,
} from "~/lib/predict/types";

const STATE_FETCH_CONCURRENCY = 6;

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

function placeholderCards(oracles: PredictOracleListItem[]): PredictPlayCard[] {
  return oracles.map((oracle) => cardFromState(oracle, fallbackOracleState(oracle)));
}

async function enrichCardsProgressively(
  oracles: PredictOracleListItem[],
  onCardReady: (index: number, card: PredictPlayCard) => void,
  concurrency = STATE_FETCH_CONCURRENCY
) {
  if (oracles.length === 0) return;

  let nextIndex = 0;
  const limit = Math.max(1, Math.min(concurrency, oracles.length));

  async function worker() {
    for (;;) {
      const index = nextIndex++;
      if (index >= oracles.length) return;

      const oracle = oracles[index];
      try {
        const state = await fetchOracleState(oracle.oracle_id);
        onCardReady(index, cardFromState(oracle, state));
      } catch {
        onCardReady(index, cardFromState(oracle, fallbackOracleState(oracle)));
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
}

export function usePredictPlayCards() {
  const [cards, setCards] = useState<PredictPlayCard[]>([]);
  const [catalog, setCatalog] = useState<OracleCatalogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);
  const hasCardsRef = useRef(false);

  const applyCatalog = useCallback((allOracles: PredictOracleListItem[], generation: number) => {
      const nowMs = Date.now();
      const catalogSummary = summarizeOracleCatalog(allOracles, nowMs);
      const oracles = sortActiveOracles(allOracles, nowMs);

      setCatalog(catalogSummary);

      if (oracles.length === 0) {
        setCards([]);
        setIsLoading(false);
        return Promise.resolve();
      }

      const placeholders = placeholderCards(oracles);
      hasCardsRef.current = true;
      setCards(placeholders);
      setIsLoading(false);

      return enrichCardsProgressively(oracles, (index, card) => {
        if (generation !== loadGenerationRef.current) return;
        setCards((previous) => {
          if (index >= previous.length) return previous;
          const next = previous.slice();
          next[index] = card;
          return next;
        });
      });
    },
    []
  );

  const load = useCallback(async (options?: { force?: boolean }) => {
    const generation = ++loadGenerationRef.current;

    if (options?.force) clearPredictPlayCache();

    const hasWarmCache = !options?.force && Boolean(getCachedOracleCatalog());
    if (hasWarmCache || hasCardsRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let allOracles: PredictOracleListItem[];
      try {
        allOracles = await fetchOracleCatalogCached();
      } catch (catalogErr) {
        const stale = getStaleOracleCatalog();
        if (!stale) throw catalogErr;
        allOracles = stale;
        if (generation === loadGenerationRef.current) {
          setError(
            catalogErr instanceof Error ? catalogErr.message : "Failed to load prediction markets"
          );
        }
      }
      if (generation !== loadGenerationRef.current) return;

      await applyCatalog(allOracles, generation);
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      if (hasCardsRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load prediction markets");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load prediction markets");
      setCards([]);
      setCatalog(null);
    } finally {
      if (generation === loadGenerationRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [applyCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    cards,
    catalog,
    isLoading,
    isRefreshing,
    error,
    refetch: () => load({ force: true }),
  };
}
