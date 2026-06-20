import { useOnboarding } from "~/components/onboarding/onboarding-context";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppHeader } from "~/components/navigation/app-header";
import { MobileDrawer } from "~/components/navigation/mobile-drawer";
import { useNavSearch } from "~/context/nav-search-context";
import { FeaturedMarketHero } from "~/components/play/featured-market-hero";
import { HedgeLpPromoBanner } from "~/components/play/hedge-lp-promo-banner";
import { MarketCardPolymarket } from "~/components/play/market-card-polymarket";
import { MarketExpiryChips } from "~/components/play/market-expiry-chips";
import { MarketGridSkeleton } from "~/components/play/market-grid-skeleton";
import { MarketListCardMobile } from "~/components/play/market-list-card-mobile";
import { BetAmountModal } from "~/components/trading/bet-amount-modal";
import { RangeMintModal, type RangeBandOption } from "~/components/trading/range-mint-modal";
import { TradeToast } from "~/components/trading/trade-toast";
import { marketCardImage } from "~/constants/market-images";
import { usePredictPlayCards } from "~/hooks/use-predict-play-cards";
import { usePredictTrade } from "~/hooks/use-predict-trade";
import { matchesSearchQuery } from "~/lib/navigation/matches-search-query";
import { underlyingPairLabel } from "~/lib/predict/format";
import {
  isTradeablePlayCard,
  matchesMarketExpiryFilter,
  type MarketExpiryFilter,
} from "~/lib/predict/market-expiry-filter";
import { excludeFeaturedMarket, pickFeaturedMarket } from "~/lib/predict/pick-featured-market";
import type { PredictPlayCard } from "~/lib/predict/types";

type PendingTrade =
  | { kind: "directional"; card: PredictPlayCard; isUp: boolean }
  | { kind: "range"; card: PredictPlayCard; band: RangeBandOption };

export default function PlayRoute() {
  const { t } = useTranslation();
  const { openOnboarding } = useOnboarding();
  const { authenticated } = usePrivy();
  const { searchQuery, setSearchQuery } = useNavSearch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<MarketExpiryFilter>("all");
  const [assetFilter, setAssetFilter] = useState<string | null>(null);
  const { cards, catalog, isLoading, isRefreshing, error, refetch } = usePredictPlayCards();
  const [listNowMs, setListNowMs] = useState(() => Date.now());

  const trade = usePredictTrade();
  const [betOpen, setBetOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [pending, setPending] = useState<PendingTrade | null>(null);
  const [rangeCard, setRangeCard] = useState<PredictPlayCard | null>(null);

  useEffect(() => {
    const id = setInterval(() => setListNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tradeableCards = useMemo(
    () =>
      [...cards]
        .filter((c) => isTradeablePlayCard(c, listNowMs))
        .sort((a, b) => a.oracle.expiry - b.oracle.expiry),
    [cards, listNowMs]
  );

  const filteredCards = useMemo(() => {
    return tradeableCards.filter((card) => {
      if (!matchesMarketExpiryFilter(card, expiryFilter, listNowMs)) return false;
      if (assetFilter && card.oracle.underlying_asset.toUpperCase() !== assetFilter)
        return false;
      if (
        !matchesSearchQuery(
          searchQuery,
          card.oracle.underlying_asset,
          underlyingPairLabel(card.oracle.underlying_asset),
          card.oracle.oracle_id
        )
      )
        return false;
      return true;
    });
  }, [tradeableCards, expiryFilter, assetFilter, searchQuery, listNowMs]);

  const featuredCard = useMemo(() => pickFeaturedMarket(filteredCards), [filteredCards]);
  const gridCards = useMemo(
    () => excludeFeaturedMarket(filteredCards, featuredCard),
    [filteredCards, featuredCard]
  );

  const startDirectional = (card: PredictPlayCard, isUp: boolean) => {
    if (!authenticated) {
      openOnboarding();
      return;
    }
    setPending({ kind: "directional", card, isUp });
    setBetOpen(true);
  };

  const startRange = (card: PredictPlayCard) => {
    if (!authenticated) {
      openOnboarding();
      return;
    }
    setRangeCard(card);
    setRangeOpen(true);
  };

  const onBetConfirm = async (stakeUsd: number) => {
    if (!pending) return;
    setBetOpen(false);
    if (pending.kind === "directional") {
      await trade.mintDirectional(pending.card, pending.isUp, stakeUsd);
    }
    setPending(null);
  };

  const onRangeSelect = (band: RangeBandOption) => {
    setRangeOpen(false);
    setPending({ kind: "range", card: rangeCard!, band });
    setBetOpen(true);
  };

  const onRangeConfirm = async (stakeUsd: number) => {
    if (pending?.kind !== "range") return;
    setBetOpen(false);
    await trade.mintRange(pending.card, pending.band, stakeUsd);
    setPending(null);
    setRangeCard(null);
  };

  return (
    <>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AppHeader
        searchPlaceholder={t("play.searchMarkets")}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onMenuPress={() => setMenuOpen(true)}
        title={t("play.allMarketsTitle")}
      />

      <div className="px-4 py-4 lg:px-8 max-w-[1400px] mx-auto w-full flex flex-col gap-4">
        <div className="play-markets-layout">
          <HedgeLpPromoBanner />

          <div className="play-markets-layout__body">
            {catalog ? (
              <MarketExpiryChips
                value={expiryFilter}
                onChange={setExpiryFilter}
                assets={catalog.activeAssets}
                assetFilter={assetFilter}
                onAssetFilterChange={setAssetFilter}
              />
            ) : null}

            {isRefreshing && cards.length > 0 ? (
              <p className="play-refresh-hint" aria-live="polite">
                Updating markets…
              </p>
            ) : null}

            {error && cards.length > 0 ? (
              <div className="play-markets-error glass-card text-sm">
                <p className="m-0 text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 text-hedge-primary font-semibold border-0 bg-transparent cursor-pointer p-0">
                  Retry
                </button>
              </div>
            ) : null}

            {trade.gasRequired ? (
              <div className="glass-card text-sm">
                <p className="m-0 font-semibold">Testnet SUI required for gas</p>
                <p className="text-hedge-muted mt-1 m-0">
                  Fund your wallet with testnet SUI, then try again.
                </p>
                <button
                  type="button"
                  className="mt-3 text-hedge-primary font-semibold border-0 bg-transparent cursor-pointer"
                  onClick={() => trade.setGasRequired(false)}>
                  Dismiss
                </button>
              </div>
            ) : null}

            {isLoading && cards.length === 0 ? (
              <MarketGridSkeleton />
            ) : error && cards.length === 0 ? (
              <div className="glass-card text-center">
                <p className="text-red-600 m-0">{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-4 text-hedge-primary font-semibold border-0 bg-transparent cursor-pointer">
                  Retry
                </button>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="glass-card text-center text-hedge-muted">
                <p className="m-0 font-semibold">{t("play.searchMarketsEmpty")}</p>
                {cards.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExpiryFilter("all");
                      setAssetFilter(null);
                      setSearchQuery("");
                    }}
                    className="mt-3 text-hedge-primary font-semibold border-0 bg-transparent cursor-pointer">
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {featuredCard ? (
                  <FeaturedMarketHero
                    card={featuredCard}
                    onBetUp={() => startDirectional(featuredCard, true)}
                    onBetDown={() => startDirectional(featuredCard, false)}
                  />
                ) : null}

                {gridCards.length > 0 ? (
                  <>
                    <h2 className="play-more-markets__title">{t("play.moreMarkets")}</h2>
                    <div className="market-list-mobile flex flex-col gap-4">
                      {gridCards.map((card, index) => (
                        <MarketListCardMobile
                          key={card.oracle.oracle_id}
                          card={card}
                          image={marketCardImage(index)}
                          onBetUp={() => startDirectional(card, true)}
                          onBetDown={() => startDirectional(card, false)}
                          onBetRange={() => startRange(card)}
                        />
                      ))}
                    </div>
                    <div className="market-grid-desktop">
                      {gridCards.map((card) => (
                        <MarketCardPolymarket
                          key={card.oracle.oracle_id}
                          card={card}
                          onBetUp={() => startDirectional(card, true)}
                          onBetDown={() => startDirectional(card, false)}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <BetAmountModal
        open={betOpen}
        defaultAmountUsd={trade.defaultStakeUsd}
        walletBalanceUsd={trade.walletBalanceUsd}
        isSubmitting={trade.isTrading}
        onClose={() => {
          setBetOpen(false);
          setPending(null);
        }}
        onConfirm={pending?.kind === "range" ? onRangeConfirm : onBetConfirm}
      />

      <RangeMintModal
        open={rangeOpen}
        card={rangeCard}
        bands={rangeCard ? trade.rangeBandsForCard(rangeCard) : []}
        onSelect={onRangeSelect}
        onClose={() => {
          setRangeOpen(false);
          setRangeCard(null);
        }}
      />

      <TradeToast
        visible={trade.toast.visible}
        status={trade.toast.status}
        message={trade.toast.message}
      />
    </>
  );
}
