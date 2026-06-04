import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  formatExpiryCountdown,
  formatPredictOdds,
  formatPredictQuote,
  formatPredictStrike,
  formatPositionQuantity,
  underlyingPairLabel,
} from "~/lib/predict/format";
import { isMarketExpired } from "~/lib/predict/position-lifecycle";
import { positionStrikeRaw } from "~/lib/predict/position-redeem";
import type { PredictPositionSummary } from "~/lib/predict/types";

type PositionSummaryCardProps = {
  position: PredictPositionSummary;
  hidePnl?: boolean;
  onClosePress?: () => void;
  isClosing?: boolean;
};

export function PositionSummaryCard({
  position,
  hidePnl = false,
  onClosePress,
  isClosing,
}: PositionSummaryCardProps) {
  const { t } = useTranslation();
  const [expiryLabel, setExpiryLabel] = useState(() =>
    formatExpiryCountdown(position.expiry)
  );

  useEffect(() => {
    const tick = () => setExpiryLabel(formatExpiryCountdown(position.expiry));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [position.expiry]);

  const expired = isMarketExpired(position);
  const direction = position.is_up ? "UP" : "DOWN";
  const pnl = position.open_quantity > 0 ? position.unrealized_pnl : position.realized_pnl;
  const pnlPositive = pnl >= 0;
  const isOpen = position.open_quantity > 0;

  const pnlText = hidePnl
    ? "••••"
    : `${pnlPositive ? "+" : ""}${formatPredictQuote(pnl)} DUSDC`;

  return (
    <article className="position-summary-card glass-card">
      <div className="position-summary-card__header">
        <div>
          <p className="position-summary-card__pair m-0">
            {underlyingPairLabel(position.underlying_asset)}
          </p>
          <p className="position-summary-card__direction m-0">
            {t("positions.direction", { direction })} ·{" "}
            {formatPredictStrike(positionStrikeRaw(position))}
          </p>
        </div>
        <span
          className={
            isOpen
              ? "position-summary-card__badge position-summary-card__badge--open"
              : "position-summary-card__badge position-summary-card__badge--closed"
          }>
          {isOpen ? t("positions.statusOpen") : t("positions.statusClosed")}
        </span>
      </div>

      <div className="position-summary-card__chips">
        <span className="position-summary-card__chip">
          {t("positions.qty")} {formatPositionQuantity(position.open_quantity)}
        </span>
        <span className="position-summary-card__chip">
          {t("positions.cost")} ${formatPredictQuote(position.open_cost_basis)}
        </span>
        <span className="position-summary-card__chip position-summary-card__chip--accent">
          {t("positions.mark")}{" "}
          {position.mark_price != null ? formatPredictOdds(position.mark_price) : "—"}
        </span>
      </div>

      <div className="position-summary-card__footer">
        <span className="position-summary-card__expiry">
          {expired ? t("positions.expired") : t("positions.expires", { time: expiryLabel })}
        </span>
        <span
          className={
            pnlPositive
              ? "position-summary-card__pnl position-summary-card__pnl--up"
              : "position-summary-card__pnl position-summary-card__pnl--down"
          }>
          {pnlText}
        </span>
      </div>

      {isOpen && onClosePress ? (
        <button
          type="button"
          className="position-summary-card__close"
          disabled={isClosing}
          onClick={onClosePress}>
          {isClosing ? (
            <span className="portfolio-assets__spinner portfolio-assets__spinner--light" aria-hidden />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {t("positions.closePosition")}
            </>
          )}
        </button>
      ) : null}
    </article>
  );
}
