import { useCallback, useEffect, useState } from "react";

import { buildMarketActivity } from "~/lib/predict/market-feed";
import {
  fetchOracleState,
  fetchOracleTrades,
  fetchPositionsMinted,
  fetchPositionsRedeemed,
} from "~/lib/predict/predict-server";
import { filterMintedByOracle, filterRedeemedByOracle } from "~/lib/predict/market-feed";
import type { MarketActivityRow, PredictOracleListItem } from "~/lib/predict/types";

type UseMarketOracleFeedArgs = {
  oracle: PredictOracleListItem;
  forward: number;
  enabled?: boolean;
  pollMs?: number;
};

async function loadOracleMintHistory(oracleId: string) {
  let [minted, redeemed] = await Promise.all([
    fetchPositionsMinted(oracleId),
    fetchPositionsRedeemed(oracleId),
  ]);

  if (minted.length === 0 && redeemed.length === 0) {
    const [allMinted, allRedeemed] = await Promise.all([
      fetchPositionsMinted(undefined, 400),
      fetchPositionsRedeemed(undefined, 400),
    ]);
    minted = filterMintedByOracle(allMinted, oracleId);
    redeemed = filterRedeemedByOracle(allRedeemed, oracleId);
  }

  return { minted, redeemed };
}

export function useMarketOracleFeed({
  oracle,
  forward,
  enabled = true,
  pollMs = 5000,
}: UseMarketOracleFeedArgs) {
  const oracleId = oracle.oracle_id;
  const expiry = oracle.expiry;
  const [activity, setActivity] = useState<MarketActivityRow[]>([]);
  const [volumeUsd, setVolumeUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const trades = await fetchOracleTrades(oracleId, 120);
      const rows = buildMarketActivity(trades, oracleId, expiry, 80);
      setActivity(rows);
      setVolumeUsd(trades.reduce((sum, trade) => {
        const raw = trade.type === "mint" ? (trade.cost ?? 0) : (trade.payout ?? 0);
        return sum + raw / 1_000_000;
      }, 0));
      await fetchOracleState(oracleId).catch(() => null);
      await loadOracleMintHistory(oracleId).catch(() => null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, expiry, forward, oracleId]);

  useEffect(() => {
    if (!enabled) {
      setActivity([]);
      setVolumeUsd(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, refresh]);

  return { activity, volumeUsd, isLoading };
}

export function formatMarketVolume(usd: number): string {
  if (usd >= 1_000_000) return `$${Math.round(usd / 1_000_000)}M Vol`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K Vol`;
  return `$${Math.max(0, Math.round(usd))} Vol`;
}
