import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TokenHolding } from "~/hooks/use-all-token-balances";
import { matchesSearchQuery } from "~/lib/navigation/matches-search-query";

type AssetsTab = "assets" | "markets";

type PortfolioAssetsSectionProps = {
  holdings: TokenHolding[];
  isLoading?: boolean;
  hasWallet: boolean;
  searchQuery?: string;
  onTabChange?: (tab: AssetsTab) => void;
};

export function PortfolioAssetsSection({
  holdings,
  isLoading = false,
  hasWallet,
  searchQuery = "",
  onTabChange,
}: PortfolioAssetsSectionProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AssetsTab>("assets");

  useEffect(() => {
    onTabChange?.(tab);
  }, [onTabChange, tab]);

  const filteredHoldings = useMemo(() => {
    if (tab !== "assets") return holdings;
    return holdings.filter((holding) =>
      matchesSearchQuery(
        searchQuery,
        holding.token.symbol,
        holding.token.name,
        holding.token.id,
        holding.balanceDisplay
      )
    );
  }, [holdings, searchQuery, tab]);

  return (
    <section className="portfolio-assets">
      <div className="portfolio-assets__tabs">
        <button
          type="button"
          className={
            tab === "assets"
              ? "portfolio-assets__tab portfolio-assets__tab--active"
              : "portfolio-assets__tab"
          }
          onClick={() => {
            setTab("assets");
            onTabChange?.("assets");
          }}>
          {t("portfolio.allAssetsTab")}
        </button>
        <button
          type="button"
          className={
            tab === "markets"
              ? "portfolio-assets__tab portfolio-assets__tab--active"
              : "portfolio-assets__tab"
          }
          onClick={() => {
            setTab("markets");
            onTabChange?.("markets");
          }}>
          {t("portfolio.marketsTab")}
        </button>
      </div>

      {tab === "assets" ? (
        !hasWallet ? (
          <TabEmptyState
            title={t("portfolio.noAssets")}
            message={t("portfolio.noWalletHint")}
          />
        ) : isLoading ? (
          <div className="portfolio-assets__loading">
            <span className="portfolio-assets__spinner" aria-hidden />
          </div>
        ) : filteredHoldings.length === 0 && searchQuery.trim() ? (
          <TabEmptyState
            title={t("common.searchNoResults")}
            message={t("portfolio.searchAssetsEmpty")}
          />
        ) : (
          <ul className="portfolio-assets__list">
            {filteredHoldings.map((holding) => (
              <li key={holding.token.id} className="portfolio-assets__row">
                <img src={holding.token.icon} alt="" className="portfolio-assets__icon" />
                <div className="portfolio-assets__meta">
                  <p className="portfolio-assets__symbol">{holding.token.symbol}</p>
                  <p className="portfolio-assets__network">{t("portfolio.testnet")}</p>
                </div>
                <p className="portfolio-assets__amount">{holding.balanceDisplay}</p>
              </li>
            ))}
          </ul>
        )
      ) : (
        <TabEmptyState
          title={t("portfolio.noMarkets")}
          message={t("portfolio.noMarketsHint")}
        />
      )}
    </section>
  );
}

function TabEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="portfolio-assets__empty">
      <p className="portfolio-assets__empty-title">{title}</p>
      <p className="portfolio-assets__empty-msg">{message}</p>
    </div>
  );
}
