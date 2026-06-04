import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { PositionSummaryCard } from "~/components/positions/position-summary-card";
import { TabEmptyState } from "~/components/ui/tab-empty-state";
import { usePredictManager } from "~/hooks/use-predict-manager";
import { usePredictPortfolio } from "~/hooks/use-predict-portfolio";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";

export default function HistoryRoute() {
  const { t } = useTranslation();
  const { user, suiAddress, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();
  const { managerId, hasManager, isChecking, isCreating } = usePredictManager({
    owner: suiAddress,
    publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
    signRawHash,
    getAccessToken,
  });

  const { positions, isLoading, isSyncing, error, refresh } = usePredictPortfolio({
    owner: suiAddress,
    managerId,
  });

  const closedPositions = useMemo(
    () =>
      positions
        .filter((p) => p.open_quantity === 0)
        .sort((a, b) => b.last_activity_at - a.last_activity_at),
    [positions]
  );

  useEffect(() => {
    void refresh({ silent: true });
  }, [refresh]);

  const showAccountCta = !isChecking && !isCreating && !hasManager;
  const isInitialLoading =
    isChecking || isCreating || (hasManager && isLoading && positions.length === 0 && !error);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <HedgePageModalShell
      title={t("history.title")}
      subtitle={t("history.subtitle")}
      requireAuth
      onRefresh={!showAccountCta && !isInitialLoading ? handleRefresh : undefined}
      isRefreshing={isLoading || isSyncing}>
      {isInitialLoading ? (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : showAccountCta ? (
        <TabEmptyState
          icon="wallet"
          title={t("positions.noAccountTitle")}
          message={t("positions.noAccountBody")}
        />
      ) : error ? (
        <div className="hedge-page__centered">
          <TabEmptyState icon="cloud" title={t("history.loadError")} message={error} />
          <button type="button" className="hedge-btn-primary" onClick={handleRefresh}>
            {t("play.retry")}
          </button>
        </div>
      ) : closedPositions.length === 0 ? (
        <TabEmptyState
          icon="time"
          title={t("history.empty")}
          message={t("history.emptyHint")}
        />
      ) : (
        <div className="hedge-page__stack">
          <h2 className="hedge-page__section-title">{t("positions.closedSection")}</h2>
          <ul className="hedge-page__list">
            {closedPositions.map((position) => (
              <li key={`closed-${position.oracle_id}-${position.strike}-${position.is_up}-${position.last_activity_at}`}>
                <PositionSummaryCard position={position} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </HedgePageModalShell>
  );
}
