import { useTranslation } from "react-i18next";

import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import {
  formatPredictQuote,
  formatPredictStrike,
  formatPositionQuantity,
  underlyingPairLabel,
} from "~/lib/predict/format";
import { estimateClosePayoutUsd } from "~/lib/predict/position-redeem";
import type { PredictPositionSummary } from "~/lib/predict/types";

type ClosePositionOverlayProps = {
  open: boolean;
  position: PredictPositionSummary | null;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ClosePositionOverlay({
  open,
  position,
  isSubmitting,
  onConfirm,
  onClose,
}: ClosePositionOverlayProps) {
  const { t } = useTranslation();

  if (!position) return null;

  const direction = position.is_up ? "UP" : "DOWN";
  const payoutEstimate = estimateClosePayoutUsd(position);
  const payoutLabel =
    payoutEstimate != null
      ? `~${formatPredictQuote(payoutEstimate)} DUSDC`
      : t("positions.closeSheetPayoutUnknown");

  const footer = (
    <div className="close-position-overlay__footer-actions">
      <button
        type="button"
        className="hedge-btn-primary"
        disabled={isSubmitting}
        onClick={onConfirm}>
        {isSubmitting ? (
          <span className="portfolio-assets__spinner portfolio-assets__spinner--light" aria-hidden />
        ) : (
          t("positions.closeSheetConfirm")
        )}
      </button>
      <button
        type="button"
        className="hedge-btn-secondary"
        disabled={isSubmitting}
        onClick={onClose}>
        {t("positions.closeSheetCancel")}
      </button>
    </div>
  );

  return (
    <HedgeOverlay open={open} onClose={onClose} title={t("positions.closeSheetTitle")} footer={footer}>
      <div className="close-position-overlay">
        <p className="close-position-overlay__lead">{t("positions.closeSheetLead")}</p>
        <div className="glass-card close-position-overlay__summary">
          <p className="close-position-overlay__pair m-0">
            {underlyingPairLabel(position.underlying_asset)}
          </p>
          <p className="close-position-overlay__meta m-0">
            {t("positions.direction", { direction })} · {formatPredictStrike(position.strike)}
          </p>
          <div className="close-position-overlay__row">
            <span>{t("positions.qty")}</span>
            <span>{formatPositionQuantity(position.open_quantity)}</span>
          </div>
          <div className="close-position-overlay__row">
            <span>{t("positions.closeSheetEstPayout")}</span>
            <span>{payoutLabel}</span>
          </div>
        </div>
        <p className="close-position-overlay__hint">{t("positions.closeSheetHint")}</p>
      </div>
    </HedgeOverlay>
  );
}
