import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MARKET_ASSET_ICON } from "~/constants/market-images";
import { formatExpiryCountdown } from "~/lib/predict/format";
import {
  isCardPriceLoading,
  marketListTitle,
  marketPriceLean,
  marketSubtitle,
} from "~/lib/predict/market-display";
import { formatMarketWindowLabel } from "~/lib/predict/format";
import type { PredictPlayCard } from "~/lib/predict/types";

type MarketListCardMobileProps = {
  card: PredictPlayCard;
  image: string;
  onBetUp: () => void;
  onBetDown: () => void;
  onBetRange: () => void;
};

export function MarketListCardMobile({
  card,
  image,
  onBetUp,
  onBetDown,
  onBetRange,
}: MarketListCardMobileProps) {
  const { t } = useTranslation();
  const asset = card.oracle.underlying_asset.toUpperCase();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const windowLabel = formatMarketWindowLabel(card.oracle.expiry, nowMs);
  const countdown = formatExpiryCountdown(card.oracle.expiry, nowMs);
  const lean = marketPriceLean(card.spot, card.forward);
  const leanLabel = t(lean.isUp ? "play.leanUp" : "play.leanDown");
  const priceLoading = isCardPriceLoading(card);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <article className="market-card-mobile">
      <img src={image} alt="" className="cover" />
      <div className="p-[18px] pt-4 flex gap-3">
        <img
          src={MARKET_ASSET_ICON}
          alt=""
          className="w-9 h-9 rounded-[10px] object-cover bg-hedge-surface"
        />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-bold leading-snug tracking-tight">
            {marketListTitle(card, windowLabel)}
          </h3>
          <p className="m-0 mt-1.5 text-[13px] text-hedge-muted">
            {priceLoading ? (
              <span className="market-price-pending market-price-pending--wide" aria-hidden />
            ) : (
              <>
                {marketSubtitle(card)} · {leanLabel}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="px-[18px] flex gap-2.5">
        <button type="button" className="btn-up" onClick={onBetUp}>
          {t("play.betUp")}
        </button>
        <button type="button" className="btn-down" onClick={onBetDown}>
          {t("play.betDown")}
        </button>
        <button type="button" className="btn-range" onClick={onBetRange}>
          {t("play.betRange")}
        </button>
      </div>
      <div className="px-[18px] pb-[18px] flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="font-semibold text-red-500 tracking-wide">{t("play.marketLive")}</span>
          <span className="text-gray-300">·</span>
          <span className="text-hedge-muted">{asset}</span>
        </div>
        <span className="font-semibold text-hedge-accent">{countdown}</span>
      </div>
    </article>
  );
}
