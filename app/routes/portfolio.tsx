import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "~/components/auth/require-auth";
import { AppHeader } from "~/components/navigation/app-header";
import { MobileDrawer } from "~/components/navigation/mobile-drawer";
import { PortfolioAssetsSection } from "~/components/portfolio/portfolio-assets-section";
import { PortfolioBalanceCard } from "~/components/portfolio/portfolio-balance-card";
import { PortfolioBalancePicker } from "~/components/portfolio/portfolio-balance-picker";
import { ReceiveOverlay } from "~/components/portfolio/receive-overlay";
import { SendOverlay } from "~/components/portfolio/send-overlay";
import {
  PORTFOLIO_ALL_VIEW,
  type PortfolioBalanceViewId,
} from "~/constants/portfolio";
import { SEND_TOKENS, type SendTokenId } from "~/constants/send-tokens";
import { useAllTokenBalances } from "~/hooks/use-all-token-balances";
import { usePortfolioUsdChart } from "~/hooks/use-portfolio-usd-chart";
import { useSendTokenBalance } from "~/hooks/use-send-token-balance";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { useSuiActivity } from "~/hooks/use-sui-activity";
import { useSuiUsdPrice } from "~/hooks/use-sui-usd-price";
import { useTokenBalanceChart } from "~/hooks/use-token-balance-chart";
import type { ChartPeriod } from "~/lib/portfolio/balance-history";
import { formatTokenBalanceDisplay } from "~/lib/portfolio/format-balance";
import { computePortfolioTotalUsd, formatUsd } from "~/lib/portfolio/usd-value";

export default function PortfolioRoute() {
  const { t } = useTranslation();
  const { isReady, username, email, suiAddress } = useSuiAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assetsTab, setAssetsTab] = useState<"assets" | "markets">("assets");
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<PortfolioBalanceViewId>("all");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("1H");

  const isAllView = selectedViewId === "all";
  const token = isAllView ? SEND_TOKENS.dusdc : SEND_TOKENS[selectedViewId as SendTokenId];

  const { suiUsdPrice } = useSuiUsdPrice();
  const suiPrice = suiUsdPrice ?? 0;

  const { balance: tokenBalance, isLoading: balanceLoading } = useSendTokenBalance(
    suiAddress,
    token
  );
  const { holdings: allHoldings, isLoading: allBalancesLoading } = useAllTokenBalances(suiAddress);
  const { transactions, isLoading: activityLoading } = useSuiActivity(suiAddress);

  const totalUsd = useMemo(
    () => computePortfolioTotalUsd(allHoldings, suiPrice),
    [allHoldings, suiPrice]
  );

  const currentAmount = isAllView ? totalUsd : (tokenBalance?.amount ?? 0);

  const singleTokenChart = useTokenBalanceChart({
    token,
    period: chartPeriod,
    currentAmount: isAllView ? 0 : currentAmount,
    transactions,
    isLoading: !isAllView && (balanceLoading || activityLoading),
  });

  const usdChart = usePortfolioUsdChart({
    period: chartPeriod,
    currentUsdTotal: totalUsd,
    transactions,
    suiUsdPrice: suiPrice,
    isLoading: isAllView && (allBalancesLoading || activityLoading),
  });

  const chartAnalytics = isAllView ? usdChart : singleTokenChart;

  const totalBalanceDisplay = useMemo(() => {
    if (isAllView) return formatUsd(totalUsd);
    return tokenBalance
      ? formatTokenBalanceDisplay(token, tokenBalance.formatted)
      : formatTokenBalanceDisplay(token, "0");
  }, [isAllView, totalUsd, token, tokenBalance]);

  const openTokenPicker = useCallback(() => setTokenPickerOpen(true), []);

  const balanceCard = useMemo(
    () => ({
      label: t("portfolio.totalBalance"),
      network: isAllView ? PORTFOLIO_ALL_VIEW.label : token.symbol,
      balance: totalBalanceDisplay,
      tokenIcon: isAllView ? PORTFOLIO_ALL_VIEW.icon : token.icon,
      onTokenPress: openTokenPicker,
    }),
    [isAllView, openTokenPicker, t, token.icon, token.symbol, totalBalanceDisplay]
  );

  const searchPlaceholder =
    assetsTab === "markets" ? t("portfolio.searchMarkets") : t("portfolio.searchAssets");

  if (!isReady) {
    return (
      <div className="portfolio-page portfolio-page--loading">
        <span className="portfolio-assets__spinner" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AppHeader
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onMenuPress={() => setMenuOpen(true)}
        title={username ?? email ?? t("tabs.portfolio")}
      />

      <div className="portfolio-page">
        <RequireAuth>
        <PortfolioBalanceCard
          card={balanceCard}
          analytics={
            suiAddress
              ? {
                  chartData: chartAnalytics.chartData,
                  changeAmount: chartAnalytics.changeAmount,
                  changePercent: chartAnalytics.changePercent,
                  isPositive: chartAnalytics.isPositive,
                  chartPeriod,
                  onChartPeriodChange: setChartPeriod,
                  isCompactChart: chartAnalytics.isCompactChart,
                }
              : undefined
          }
          onReceivePress={() => setReceiveOpen(true)}
          onSendPress={() => setSendOpen(true)}
        />

        <PortfolioAssetsSection
          holdings={allHoldings}
          isLoading={allBalancesLoading}
          hasWallet={Boolean(suiAddress)}
          searchQuery={searchQuery}
          onTabChange={setAssetsTab}
        />
        </RequireAuth>
      </div>

      <PortfolioBalancePicker
        open={tokenPickerOpen}
        selectedId={selectedViewId}
        onClose={() => setTokenPickerOpen(false)}
        onSelect={setSelectedViewId}
      />
      <SendOverlay open={sendOpen} onClose={() => setSendOpen(false)} />
      <ReceiveOverlay open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </>
  );
}
