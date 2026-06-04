import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { LeaderboardList } from "~/components/leaderboard/leaderboard-list";
import { LeaderboardPodium } from "~/components/leaderboard/leaderboard-podium";
import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { useExperienceLeaderboard } from "~/hooks/use-experience-leaderboard";
import { useSuiAccount } from "~/hooks/use-sui-account";

export default function LeaderboardRoute() {
  const { t } = useTranslation();
  const { suiAddress } = useSuiAccount();
  const { users, isLoading, isRefreshing, error, refetch } = useExperienceLeaderboard();

  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const showLoading = isLoading && users.length === 0;

  return (
    <HedgePageModalShell
      title={t("menu.leaderboard")}
      subtitle={t("menu.leaderboardHint")}
      wide
      onRefresh={() => refetch()}
      isRefreshing={isRefreshing}>
      <div className="leaderboard-page">
        <LeaderboardPodium users={topThree} isLoading={showLoading} />
        <LeaderboardList
          users={users}
          currentUserAddress={suiAddress}
          isLoading={showLoading}
          isError={Boolean(error)}
          errorMessage={error}
          onRetry={() => refetch()}
        />
      </div>
    </HedgePageModalShell>
  );
}
