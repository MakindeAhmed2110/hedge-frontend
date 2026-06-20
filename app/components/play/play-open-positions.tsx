import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ClosePositionOverlay } from "~/components/positions/close-position-overlay";
import { PositionSummaryCard } from "~/components/positions/position-summary-card";
import { TradeToast } from "~/components/trading/trade-toast";
import { usePredictPortfolio } from "~/hooks/use-predict-portfolio";
import { useSuiAccount } from "~/hooks/use-sui-account";
import {
  PredictTradeError,
  redeemDirectionalPosition,
} from "~/lib/predict/execute-predict";
import { positionOpenQuantityRaw, positionStrikeRaw } from "~/lib/predict/position-redeem";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";
import type { PredictPositionSummary } from "~/lib/predict/types";

type PlayOpenPositionsProps = {
  owner: string | null | undefined;
  managerId: string | null | undefined;
};

function positionKey(p: PredictPositionSummary) {
  return `${p.oracle_id}:${p.strike}:${p.is_up}`;
}

/** Compact strip of the user's open positions, shown inline on the play page. */
export function PlayOpenPositions({ owner, managerId }: PlayOpenPositionsProps) {
  const { t } = useTranslation();
  const { user, suiAddress, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();
  const { openPositions, optimisticallyClosePosition, syncAfterClose } = usePredictPortfolio({
    owner,
    managerId,
  });

  const [positionToClose, setPositionToClose] = useState<PredictPositionSummary | null>(null);
  const [closingKey, setClosingKey] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    status: "processing" as "processing" | "success" | "error",
    message: null as string | null,
  });

  const signContext = useMemo(() => {
    if (!suiAddress || !signRawHash) return null;
    return {
      senderAddress: suiAddress,
      publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
      signRawHash,
      getAccessToken,
    };
  }, [suiAddress, user, signRawHash, getAccessToken]);

  const handleConfirmClose = useCallback(async () => {
    if (!positionToClose || !signContext || !suiAddress) return;

    const key = positionKey(positionToClose);
    setClosingKey(key);
    setToast({ visible: true, status: "processing", message: null });

    try {
      await redeemDirectionalPosition(
        {
          senderAddress: suiAddress,
          oracleId: positionToClose.oracle_id,
          expiry: positionToClose.expiry,
          strike: positionStrikeRaw(positionToClose),
          isUp: positionToClose.is_up,
          quantity: positionOpenQuantityRaw(positionToClose),
        },
        signContext
      );

      const closed = positionToClose;
      optimisticallyClosePosition(closed);
      setPositionToClose(null);
      setToast({ visible: true, status: "success", message: t("positions.closeSuccess") });
      setTimeout(() => setToast((s) => ({ ...s, visible: false })), 1400);
      void syncAfterClose(closed);
    } catch (err) {
      const message =
        err instanceof PredictTradeError || err instanceof Error
          ? err.message
          : t("positions.closeFailed");
      setToast({ visible: true, status: "error", message });
      setTimeout(() => setToast((s) => ({ ...s, visible: false })), 2800);
    } finally {
      setClosingKey(null);
    }
  }, [positionToClose, signContext, suiAddress, optimisticallyClosePosition, syncAfterClose, t]);

  if (!owner || !managerId) return null;
  if (!openPositions || openPositions.length === 0) return null;

  return (
    <section className="play-open-positions" aria-label={t("play.yourPositions")}>
      <div className="play-open-positions__head">
        <h2 className="play-open-positions__title">
          {t("play.yourPositions")}
          <span className="play-open-positions__count">{openPositions.length}</span>
        </h2>
        <Link to="/positions" className="play-open-positions__view-all">
          {t("play.viewAll")}
        </Link>
      </div>

      <div className="play-open-positions__row">
        {openPositions.map((position) => {
          const key = positionKey(position);
          return (
            <div key={key} className="play-open-positions__item">
              <PositionSummaryCard
                position={position}
                onClosePress={() => setPositionToClose(position)}
                isClosing={closingKey === key}
              />
            </div>
          );
        })}
      </div>

      <ClosePositionOverlay
        open={positionToClose != null}
        position={positionToClose}
        isSubmitting={closingKey != null}
        onConfirm={() => void handleConfirmClose()}
        onClose={() => {
          if (!closingKey) setPositionToClose(null);
        }}
      />

      <TradeToast visible={toast.visible} status={toast.status} message={toast.message} />
    </section>
  );
}
