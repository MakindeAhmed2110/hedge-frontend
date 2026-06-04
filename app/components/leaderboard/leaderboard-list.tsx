import { useTranslation } from "react-i18next";

import {
  formatLeaderboardAddress,
  formatLeaderboardPoints,
  getLeaderboardDisplayName,
} from "~/lib/leaderboard/format";
import type { LeaderboardUser } from "~/lib/leaderboard/types";

type LeaderboardListProps = {
  users: LeaderboardUser[];
  currentUserAddress?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function LeaderboardRow({
  user,
  rank,
  isCurrentUser,
}: {
  user: LeaderboardUser;
  rank: number;
  isCurrentUser: boolean;
}) {
  const topThree = rank <= 3;

  return (
    <li
      className={
        isCurrentUser ? "leaderboard-row leaderboard-row--you" : "leaderboard-row"
      }>
      <span className="leaderboard-row__rank">{rank}.</span>
      <div className="leaderboard-row__info">
        <p className="leaderboard-row__handle">{getLeaderboardDisplayName(user)}</p>
        <p className="leaderboard-row__address">{formatLeaderboardAddress(user.userAddress)}</p>
      </div>
      <span
        className={
          topThree ? "leaderboard-row__points leaderboard-row__points--top" : "leaderboard-row__points"
        }>
        {formatLeaderboardPoints(user.experience.totalXp)}
      </span>
    </li>
  );
}

export function LeaderboardList({
  users,
  currentUserAddress,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: LeaderboardListProps) {
  const { t } = useTranslation();

  return (
    <section className="leaderboard-list">
      <div className="leaderboard-list__handle" aria-hidden />
      <h2 className="leaderboard-list__title">{t("leaderboard.listTitle")}</h2>

      {isLoading ? (
        <div className="leaderboard-list__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : isError ? (
        <div className="leaderboard-list__centered">
          <p className="leaderboard-list__message">{errorMessage ?? t("leaderboard.loadError")}</p>
          {onRetry ? (
            <button type="button" className="hedge-btn-primary leaderboard-list__retry" onClick={onRetry}>
              {t("leaderboard.retry")}
            </button>
          ) : null}
        </div>
      ) : users.length === 0 ? (
        <div className="leaderboard-list__centered">
          <p className="leaderboard-list__message">{t("leaderboard.empty")}</p>
        </div>
      ) : (
        <ul className="leaderboard-list__rows">
          {users.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser =
              Boolean(currentUserAddress) &&
              user.userAddress.toLowerCase() === currentUserAddress?.toLowerCase();
            return (
              <LeaderboardRow
                key={user.userAddress}
                user={user}
                rank={rank}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
