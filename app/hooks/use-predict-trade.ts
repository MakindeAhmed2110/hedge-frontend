import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RangeBandOption } from "~/components/trading/range-mint-modal";
import { PREDICT_OBJECT_ID } from "~/constants/predict";
import { SEND_TOKENS } from "~/constants/send-tokens";
import { usePredictManager } from "~/hooks/use-predict-manager";
import { useSendTokenBalance } from "~/hooks/use-send-token-balance";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { useTradingPreferences } from "~/hooks/use-trading-preferences";
import { invalidateHedgePoints } from "~/lib/hedge/hedge-cache";
import { nudgeHedgeIndexer } from "~/lib/hedge/nudge-indexer";
import { recordHedgeMint } from "~/lib/hedge/record-mint";
import {
  mintDirectionalPosition,
  mintRangePosition,
  PredictTradeError,
} from "~/lib/predict/execute-predict";
import { walletBalanceToUsd } from "~/lib/predict/bet-amount";
import { strikeBandAroundAtm } from "~/lib/predict/strike";
import type { PredictPlayCard } from "~/lib/predict/types";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";
import type { PrivySignRawHash } from "~/lib/sui/privy-sign";
import { hasTestnetSuiGas, isNoSuiGasError } from "~/lib/sui/gas-check";

const DUSDC = SEND_TOKENS.dusdc;

export function usePredictTrade() {
  const { t } = useTranslation();
  const { user, suiAddress, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();
  const { preferences } = useTradingPreferences();
  const { managerId, ensureManager } = usePredictManager({
    owner: suiAddress,
    publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
    signRawHash,
    getAccessToken,
  });
  const { balance: dusdcBalance } = useSendTokenBalance(suiAddress, DUSDC);
  const walletBalanceUsd = walletBalanceToUsd(dusdcBalance?.raw);

  const [toast, setToast] = useState<{
    visible: boolean;
    status: "processing" | "success" | "error";
    message: string | null;
  }>({ visible: false, status: "processing", message: null });
  const [gasRequired, setGasRequired] = useState(false);
  const [isTrading, setIsTrading] = useState(false);

  const signContext = useMemo(() => {
    if (!suiAddress || !signRawHash) return null;
    return {
      senderAddress: suiAddress,
      publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
      signRawHash: signRawHash as PrivySignRawHash,
      getAccessToken,
    };
  }, [suiAddress, user, signRawHash, getAccessToken]);

  const prepareForBet = useCallback(async (): Promise<boolean> => {
    if (!suiAddress || !signContext) {
      window.alert(t("play.walletRequired"));
      return false;
    }
    const hasGas = await hasTestnetSuiGas(suiAddress);
    if (!hasGas) {
      setGasRequired(true);
      return false;
    }
    if (!managerId) {
      setToast({ visible: true, status: "processing", message: t("play.settingUpAccount") });
      try {
        await ensureManager({ silent: true });
        setToast({ visible: false, status: "processing", message: null });
      } catch (err) {
        if (isNoSuiGasError(err)) setGasRequired(true);
        else
          setToast({
            visible: true,
            status: "error",
            message: err instanceof Error ? err.message : t("play.createAccountFailed"),
          });
        return false;
      }
    }
    return true;
  }, [ensureManager, managerId, signContext, suiAddress, t]);

  const runTrade = useCallback(
    async (
      label: string,
      stakeUsd: number,
      card: PredictPlayCard,
      action: () => Promise<{ txDigest?: string }>
    ) => {
      if (!signContext || !suiAddress) return;
      if (!preferences.skipBetConfirmation) {
        const ok = window.confirm(
          t("play.confirmMintWithAmount", { amount: stakeUsd, label })
        );
        if (!ok) return;
      }
      setIsTrading(true);
      setToast({ visible: true, status: "processing", message: null });
      try {
        const result = await action();
        setToast({ visible: true, status: "success", message: label });
        const token = await getAccessToken();
        if (token && result.txDigest) {
          try {
            const recorded = await recordHedgeMint(token, {
              txDigest: result.txDigest,
              stakeUsd,
              oracleId: card.oracle.oracle_id,
              predictId: PREDICT_OBJECT_ID,
            });
            if (recorded.pointsCredited > 0) invalidateHedgePoints();
          } catch {
            void nudgeHedgeIndexer(token);
          }
          invalidateHedgePoints();
        }
        setTimeout(() => setToast((s) => ({ ...s, visible: false })), 1400);
      } catch (err) {
        if (isNoSuiGasError(err)) {
          setGasRequired(true);
          setToast((s) => ({ ...s, visible: false }));
        } else {
          const message =
            err instanceof PredictTradeError || err instanceof Error
              ? err.message
              : t("play.tradeFailed");
          setToast({ visible: true, status: "error", message });
          setTimeout(() => setToast((s) => ({ ...s, visible: false })), 2800);
        }
      } finally {
        setIsTrading(false);
      }
    },
    [getAccessToken, preferences.skipBetConfirmation, signContext, suiAddress, t]
  );

  const mintDirectional = useCallback(
    async (card: PredictPlayCard, isUp: boolean, stakeUsd: number) => {
      if (!(await prepareForBet()) || !signContext || !suiAddress) return;
      const label = isUp ? t("play.betUp") : t("play.betDown");
      await runTrade(label, stakeUsd, card, async () => {
        const result = await mintDirectionalPosition(
          {
            senderAddress: suiAddress,
            oracleId: card.oracle.oracle_id,
            expiry: card.oracle.expiry,
            strike: card.atmStrike,
            isUp,
            stakeUsd,
          },
          signContext
        );
        return { txDigest: result.digest };
      });
    },
    [prepareForBet, runTrade, signContext, suiAddress, t]
  );

  const mintRange = useCallback(
    async (card: PredictPlayCard, band: RangeBandOption, stakeUsd: number) => {
      if (!(await prepareForBet()) || !signContext || !suiAddress) return;
      await runTrade(t("play.betRange"), stakeUsd, card, async () => {
        const result = await mintRangePosition(
          {
            senderAddress: suiAddress,
            oracleId: card.oracle.oracle_id,
            expiry: card.oracle.expiry,
            lowerStrike: band.lower,
            higherStrike: band.higher,
            stakeUsd,
          },
          signContext
        );
        return { txDigest: result.digest };
      });
    },
    [prepareForBet, runTrade, signContext, suiAddress, t]
  );

  const rangeBandsForCard = useCallback((card: PredictPlayCard): RangeBandOption[] => {
    return strikeBandAroundAtm(card.atmStrike, card.oracle.tick_size, 2);
  }, []);

  return {
    walletBalanceUsd,
    isTrading,
    toast,
    gasRequired,
    setGasRequired,
    mintDirectional,
    mintRange,
    rangeBandsForCard,
    defaultStakeUsd: preferences.defaultStakeUsd,
  };
}
