import { useCallback, useEffect, useState } from "react";

import { PREDICT_OBJECT_ID } from "~/constants/predict";
import { fetchOracleState, fetchVaultSummary } from "~/lib/predict/predict-server";
import { alignStrikeToGrid } from "~/lib/predict/strike";
import {
  computeDirectionalMintQuotes,
  type DirectionalMintQuotes,
} from "~/lib/predict/trade-prices";
import type { PredictOracleListItem } from "~/lib/predict/types";

type UseOracleTradeQuotesArgs = {
  oracle: PredictOracleListItem;
  spot: number;
  forward: number;
  enabled?: boolean;
  pollMs?: number;
};

/** Live on-chain Up/Down ask prices (cents), mirroring the mobile bet panel. */
export function useOracleTradeQuotes({
  oracle,
  spot,
  forward,
  enabled = true,
  pollMs = 3000,
}: UseOracleTradeQuotesArgs) {
  const [quotes, setQuotes] = useState<DirectionalMintQuotes | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || spot <= 0) return;

    try {
      const strike = Number(alignStrikeToGrid(spot, oracle.min_strike, oracle.tick_size));
      const [state, vault] = await Promise.all([
        fetchOracleState(oracle.oracle_id),
        fetchVaultSummary(PREDICT_OBJECT_ID),
      ]);

      const next = computeDirectionalMintQuotes({
        strike,
        forward: state.latest_price?.forward ?? forward,
        svi: state.latest_svi,
        vault,
        settlementPrice: state.oracle.settlement_price,
      });

      setQuotes(next);
    } catch {
      // keep last quotes on transient errors
    }
  }, [enabled, forward, oracle.min_strike, oracle.oracle_id, oracle.tick_size, spot]);

  useEffect(() => {
    if (!enabled) {
      setQuotes(null);
      return;
    }

    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, refresh]);

  return { quotes, refresh };
}
