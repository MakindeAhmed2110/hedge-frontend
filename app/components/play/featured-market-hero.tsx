import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MarketCommentsPanel } from "~/components/play/market-comments-panel";
import { MarketLiveChart } from "~/components/play/market-live-chart";
import { MARKET_ASSET_ICON } from "~/constants/market-images";
import { useLiveMarketChart } from "~/hooks/use-live-market-chart";
import { useMarketComments } from "~/hooks/use-market-comments";
import { useMarketOracleFeed } from "~/hooks/use-market-oracle-feed";
import { useOracleTradeQuotes } from "~/hooks/use-oracle-trade-quotes";
import { directionalOddsCents } from "~/lib/predict/bet-odds";
import {
  formatExpiryCountdown,
  formatMarketWindowLabel,
  formatMarketWindowRange,
  formatPredictPrice,
} from "~/lib/predict/format";
import { isCardPriceLoading, marketListTitle } from "~/lib/predict/market-display";
import { spotFromRaw } from "~/lib/predict/strike";
import type { PredictPlayCard } from "~/lib/predict/types";

function formatEndsIn(expiryMs: number, nowMs: number): string {
  const remaining = expiryMs - nowMs;
  if (remaining <= 0) return "0:00";

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Convert ask price in cents to a payout multiplier (e.g. 52¢ -> 1.92x). */
function payoutMultiplierFromCents(cents: number): string {
  if (cents <= 0) return "—";
  const mult = 100 / cents;
  if (mult >= 10) return `${Math.round(mult)}x`;
  return `${mult.toFixed(2).replace(/\.00$/, "")}x`;
}

type FeaturedMarketHeroProps = {
  card: PredictPlayCard;
  onBetUp: () => void;
  onBetDown: () => void;
};

export function FeaturedMarketHero({ card, onBetUp, onBetDown }: FeaturedMarketHeroProps) {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const chartSeries = useLiveMarketChart(card);
  const priceLoading = isCardPriceLoading(card);
  const { comments, isLoading: commentsLoading } = useMarketComments({
    oracleId: card.oracle.oracle_id,
  });
  const { volumeUsd } = useMarketOracleFeed({
    oracle: card.oracle,
    forward: card.forward,
  });
  const { quotes } = useOracleTradeQuotes({
    oracle: card.oracle,
    spot: card.spot,
    forward: card.forward,
    enabled: !priceLoading,
  });

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const windowLabel = formatMarketWindowLabel(card.oracle.expiry, nowMs);
  const windowRange = formatMarketWindowRange(card.oracle.expiry, windowLabel);
  const spot = spotFromRaw(card.spot);
  const upMultiplier = payoutMultiplierFromCents(directionalOddsCents(true, quotes));
  const downMultiplier = payoutMultiplierFromCents(directionalOddsCents(false, quotes));

  const title = useMemo(() => {
    const asset = card.oracle.underlying_asset.toUpperCase();
    if (asset === "BTC") return "Bitcoin Up or Down";
    return marketListTitle(card, windowLabel);
  }, [card, windowLabel]);

  return (
    <article className="featured-market-hero">
      <div className="featured-market-hero__top">
        <div className="featured-market-hero__identity">
          <img src={MARKET_ASSET_ICON} alt="" className="featured-market-hero__icon" />
          <div className="featured-market-hero__copy">
            <h2 className="featured-market-hero__title">{title}</h2>
            <p className="featured-market-hero__window">{windowRange}</p>
          </div>
        </div>

        <div className="featured-market-hero__prices">
          <div className="featured-market-hero__price-block">
            <span className="featured-market-hero__price-label">{t("play.priceToBeat")}</span>
            {priceLoading ? (
              <span className="market-price-pending market-price-pending--hero" aria-hidden />
            ) : (
              <strong className="featured-market-hero__price-beat">
                ${formatPredictPrice(card.spot)}
              </strong>
            )}
          </div>
          <div className="featured-market-hero__price-block featured-market-hero__price-block--current">
            <div className="featured-market-hero__price-row">
              <span className="featured-market-hero__price-label featured-market-hero__price-label--current">
                {t("play.currentPrice")}
              </span>
            </div>
            {priceLoading ? (
              <span className="market-price-pending market-price-pending--hero" aria-hidden />
            ) : (
              <strong className="featured-market-hero__price-current">
                ${formatPredictPrice(card.forward)}
              </strong>
            )}
          </div>
        </div>

        <div className="featured-market-hero__ends">
          <span className="featured-market-hero__ends-label">{t("play.endsIn")}</span>
          <strong className="featured-market-hero__ends-value">
            {formatEndsIn(card.oracle.expiry, nowMs)}
          </strong>
        </div>
      </div>

      <div className="featured-market-hero__actions">
        <button type="button" className="featured-market-hero__bet featured-market-hero__bet--up" onClick={onBetUp}>
          <span className="featured-market-hero__bet-label">{t("play.betUp")}</span>
          <span className="featured-market-hero__bet-odds">
            {priceLoading ? "—" : upMultiplier}
          </span>
        </button>
        <button type="button" className="featured-market-hero__bet featured-market-hero__bet--down" onClick={onBetDown}>
          <span className="featured-market-hero__bet-label">{t("play.betDown")}</span>
          <span className="featured-market-hero__bet-odds">
            {priceLoading ? "—" : downMultiplier}
          </span>
        </button>
      </div>

      <div className="featured-market-hero__split">
        <MarketCommentsPanel comments={comments} volumeUsd={volumeUsd} isLoading={commentsLoading} />

        <div className="featured-market-hero__chart-pane">
          {priceLoading ? (
            <div className="featured-market-hero__chart-skeleton" aria-hidden />
          ) : (
            <MarketLiveChart data={chartSeries} priceToBeat={spot} />
          )}
          <div className="featured-market-hero__chart-meta">
            <span className="featured-market-hero__chart-countdown">
              {formatExpiryCountdown(card.oracle.expiry, nowMs)}
            </span>
            <span className="featured-market-hero__chart-right">
              <span className="featured-market-hero__live">
                <span className="featured-market-hero__live-dot" />
                {t("play.marketLive")}
              </span>
              <span className="featured-market-hero__brand">Hedge</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
