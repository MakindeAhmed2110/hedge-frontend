import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { PointsAssignmentsHistory } from "~/components/points/points-assignments-history";
import { PointsPointCard } from "~/components/points/points-point-card";
import { TabEmptyState } from "~/components/ui/tab-empty-state";
import { useAppUsername } from "~/hooks/use-app-username";
import { useHedgePoints } from "~/hooks/use-hedge-points";
import { useHedgeReferrals } from "~/hooks/use-hedge-referrals";

export default function PointsRoute() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useHedgePoints();
  const { username } = useAppUsername();
  const { profile } = useHedgeReferrals();

  const historyEntries = useMemo(() => {
    const rows = [...(data?.weeklySummary ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    if (rows.length > 0) return rows;
    if ((data?.weeklyPoints ?? 0) > 0) {
      return [{ date: "this-week", points: data!.weeklyPoints }];
    }
    if ((data?.totalPoints ?? 0) > 0) {
      return [{ date: "total", points: data!.totalPoints }];
    }
    return [];
  }, [data]);

  return (
    <HedgePageModalShell
      title={t("points.pageTitle")}
      subtitle={t("points.pageSubtitle")}
      variant="points"
      requireAuth
      onRefresh={() => void refetch()}
      isRefreshing={isLoading}>
      {isLoading && !data ? (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : error ? (
        <TabEmptyState icon="cloud" title={t("points.loadError")} message={error} />
      ) : (
        <div className="points-page__stack">
          <PointsPointCard
            totalPoints={data?.totalPoints ?? 0}
            weeklyPoints={data?.weeklyPoints ?? 0}
            isLoading={isLoading}
            handle={username ?? profile?.handle ?? null}
            referralUrl={profile?.referralUrl ?? null}
          />
          <PointsAssignmentsHistory entries={historyEntries} />
        </div>
      )}
    </HedgePageModalShell>
  );
}
