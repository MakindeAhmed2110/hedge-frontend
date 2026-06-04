import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { AppHeader } from "~/components/navigation/app-header";
import { MobileDrawer } from "~/components/navigation/mobile-drawer";
import { useMediaQuery } from "~/hooks/use-media-query";
import { ClosePositionOverlay } from "~/components/positions/close-position-overlay";
import { PositionSummaryCard } from "~/components/positions/position-summary-card";
import { PositionsSummaryCard } from "~/components/positions/positions-summary-card";
import { RequireAuth } from "~/components/auth/require-auth";
import { TradeToast } from "~/components/trading/trade-toast";
import { TabEmptyState } from "~/components/ui/tab-empty-state";
import { useAutoClearExpiredPositions } from "~/hooks/use-auto-clear-expired-positions";
import { usePredictManager } from "~/hooks/use-predict-manager";
import { usePredictPortfolio } from "~/hooks/use-predict-portfolio";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { matchesSearchQuery } from "~/lib/navigation/matches-search-query";
import {
  PredictTradeError,
  redeemDirectionalPosition,
} from "~/lib/predict/execute-predict";
import { formatPredictStrike, underlyingPairLabel } from "~/lib/predict/format";
import {
  positionOpenQuantityRaw,
  positionStrikeRaw,
} from "~/lib/predict/position-redeem";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";
import type { PredictPositionSummary } from "~/lib/predict/types";

function positionKey(p: PredictPositionSummary) {
  return `${p.oracle_id}:${p.strike}:${p.is_up}`;
}

function filterPositions(list: PredictPositionSummary[], searchQuery: string) {
  return list.filter((position) =>
    matchesSearchQuery(
      searchQuery,
      position.underlying_asset,
      underlyingPairLabel(position.underlying_asset),
      position.is_up ? "up" : "down",
      position.is_up ? "bull" : "bear",
      formatPredictStrike(position.strike),
      position.oracle_id,
      position.status
    )
  );
}

export default function PositionsRoute() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, suiAddress, username, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { managerId, hasManager, isChecking, isCreating } = usePredictManager({
    owner: suiAddress,
    publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
    signRawHash,
    getAccessToken,
  });

  const {
    summary,
    openPositions,
    expiredPendingClear,
    positions,
    isLoading,
    isSyncing,
    error,
    refresh,
    optimisticallyClosePosition,
    syncAfterClose,
  } = usePredictPortfolio({ owner: suiAddress, managerId });

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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useAutoClearExpiredPositions({
    positions: expiredPendingClear,
    signContext,
    enabled: hasManager && Boolean(signContext),
    onCleared: (cleared) => {
      optimisticallyClosePosition(cleared);
      void syncAfterClose(cleared);
    },
  });

  const filteredOpen = useMemo(
    () => filterPositions(openPositions, searchQuery),
    [openPositions, searchQuery]
  );
  const filteredExpired = useMemo(
    () => filterPositions(expiredPendingClear, searchQuery),
    [expiredPendingClear, searchQuery]
  );

  const openMarkValue = useMemo(
    () => filteredOpen.reduce((total, p) => total + (p.mark_value ?? 0), 0),
    [filteredOpen]
  );

  const showAccountCta = !isChecking && !isCreating && !hasManager;
  const isInitialLoading =
    isChecking || isCreating || (hasManager && isLoading && positions.length === 0 && !error);

  const handleConfirmClose = useCallback(async () => {
    if (!positionToClose || !signContext) return;

    const key = positionKey(positionToClose);
    setClosingKey(key);
    setToast({ visible: true, status: "processing", message: null });

    try {
      await redeemDirectionalPosition(
        {
          senderAddress: suiAddress!,
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
  }, [
    positionToClose,
    signContext,
    suiAddress,
    optimisticallyClosePosition,
    syncAfterClose,
    t,
  ]);

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      );
    }

    if (showAccountCta) {
      return (
        <TabEmptyState
          variant="card"
          icon="wallet"
          title={t("positions.noAccountTitle")}
          message={t("positions.noAccountBody")}
        />
      );
    }

    const hasVisible = openPositions.length > 0 || expiredPendingClear.length > 0;

    if (error && !hasVisible) {
      return (
        <div className="hedge-page__centered">
          <TabEmptyState icon="cloud" title={t("positions.loadError")} message={error} />
          <button type="button" className="hedge-btn-primary" onClick={() => void refresh()}>
            {t("play.retry")}
          </button>
        </div>
      );
    }

    if (openPositions.length === 0 && expiredPendingClear.length === 0) {
      return (
        <TabEmptyState
          variant="card"
          icon="pulse"
          title={t("positions.empty")}
          message={t("positions.emptyHint")}
        />
      );
    }

    if (filteredOpen.length === 0 && filteredExpired.length === 0) {
      return (
        <TabEmptyState
          variant="card"
          icon="search"
          title={t("common.searchNoResults")}
          message={t("positions.searchPositionsEmpty")}
        />
      );
    }

    return (
      <div className="positions-page__stack">
        {hasManager && summary ? (
          <div className="glass-card">
            <PositionsSummaryCard
              markValueUsd={openMarkValue}
              openCount={filteredOpen.length}
              unrealizedPnl={summary.unrealized_pnl}
              isLoading={isLoading || isSyncing}
            />
          </div>
        ) : null}

        {filteredOpen.length > 0 ? (
          <section>
            <h2 className="positions-page__section-title">
              {t("positions.openSection", { count: filteredOpen.length })}
            </h2>
            <ul className="positions-page__list">
              {filteredOpen.map((position) => {
                const key = positionKey(position);
                return (
                  <li key={key}>
                    <PositionSummaryCard
                      position={position}
                      onClosePress={() => setPositionToClose(position)}
                      isClosing={closingKey === key}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {filteredExpired.length > 0 ? (
          <section>
            <h2 className="positions-page__section-title positions-page__section-title--spaced">
              {t("positions.expiredSection", { count: filteredExpired.length })}
            </h2>
            <p className="positions-page__section-hint">{t("positions.expiredHint")}</p>
            <ul className="positions-page__list">
              {filteredExpired.map((position) => {
                const key = `expired-${positionKey(position)}`;
                return (
                  <li key={key}>
                    <PositionSummaryCard
                      position={position}
                      onClosePress={() => setPositionToClose(position)}
                      isClosing={closingKey === positionKey(position)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    );
  };

  const overlays = (
    <>
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
    </>
  );

  if (isDesktop) {
    return (
      <>
        <HedgePageModalShell
          title={t("positions.title")}
          subtitle={t("positions.subtitle")}
          requireAuth
          contentWide
          searchPlaceholder={t("positions.searchPositions")}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onRefresh={() => void refresh()}
          isRefreshing={isLoading || isSyncing}>
          {renderBody()}
        </HedgePageModalShell>
        {overlays}
      </>
    );
  }

  return (
    <>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AppHeader
        searchPlaceholder={t("positions.searchPositions")}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onMenuPress={() => setMenuOpen(true)}
        title={username ?? undefined}
      />

      <div className="positions-page">
        <RequireAuth>
          <header className="positions-page__header">
            <h1 className="positions-page__title">{t("positions.title")}</h1>
            <p className="positions-page__subtitle">{t("positions.subtitle")}</p>
          </header>
          {renderBody()}
        </RequireAuth>
      </div>

      {overlays}
    </>
  );
}
