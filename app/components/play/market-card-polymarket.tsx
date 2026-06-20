import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MARKET_ASSET_ICON } from "~/constants/market-images";
import { formatExpiryCountdown } from "~/lib/predict/format";
import {
  isCardPriceLoading,
  leanProbabilityPct,
  marketListTitle,
  marketSubtitle,
} from "~/lib/predict/market-display";
import { formatMarketWindowLabel } from "~/lib/predict/format";
import type { PredictPlayCard } from "~/lib/predict/types";

type MarketCardPolymarketProps = {
  card: PredictPlayCard;
  onBetUp: () => void;
  onBetDown: () => void;
};

export function MarketCardPolymarket({ card, onBetUp, onBetDown }: MarketCardPolymarketProps) {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const windowLabel = formatMarketWindowLabel(card.oracle.expiry, nowMs);
  const countdown = formatExpiryCountdown(card.oracle.expiry, nowMs);
  const upPct = leanProbabilityPct(card);
  const priceLoading = isCardPriceLoading(card);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <article className="market-card-poly">
      <div className="flex items-start gap-3">
        <img
          src={MARKET_ASSET_ICON}
          alt=""
          className="w-11 h-11 rounded-xl object-cover bg-hedge-surface flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[15px] font-bold leading-snug line-clamp-2">
            {marketListTitle(card, windowLabel)}
          </h3>
          <p className="m-0 mt-1 text-xs text-hedge-muted">
            {priceLoading ? (
              <span className="market-price-pending" aria-hidden />
            ) : (
              marketSubtitle(card)
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {priceLoading ? (
            <span className="market-price-pending market-price-pending--pct" aria-hidden />
          ) : (
            <span className="font-bold text-hedge-fg">{upPct}%</span>
          )}
          <span className="text-hedge-muted text-xs">{t("play.betUp")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="font-semibold text-red-500">{t("play.marketLive")}</span>
          <span className="text-gray-300">·</span>
          <span className="text-hedge-accent font-semibold">{countdown}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn-up" onClick={onBetUp}>
          {t("play.betUp")}
        </button>
        <button type="button" className="btn-down" onClick={onBetDown}>
          {t("play.betDown")}
        </button>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-hedge-border text-xs text-hedge-muted">
        <span>{card.oracle.underlying_asset.toUpperCase()} · Predict</span>
        <button
          type="button"
          className="p-1 border-0 bg-transparent cursor-pointer opacity-70 hover:opacity-100"
          aria-label={t("referrals.title")}
          title={t("menu.referrals")}>
          <img src="/assets/images/referral.png" alt="" width={18} height={18} />
        </button>
      </div>
    </article>
  );
}
