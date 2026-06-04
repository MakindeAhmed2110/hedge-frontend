import {
  formatLeaderboardAddress,
  getLeaderboardDisplayName,
} from "~/lib/leaderboard/format";
import type { LeaderboardUser } from "~/lib/leaderboard/types";

type LeaderboardPodiumProps = {
  users: LeaderboardUser[];
  isLoading?: boolean;
};

export function LeaderboardPodium({ users, isLoading }: LeaderboardPodiumProps) {
  const first = users[0];
  const second = users[1];
  const third = users[2];

  return (
    <div className="leaderboard-podium">
      <img
        src="/assets/images/leaderboard-rank.png"
        alt=""
        className="leaderboard-podium__image"
      />

      {isLoading ? (
        <div className="leaderboard-podium__loading">
          <span className="portfolio-assets__spinner portfolio-assets__spinner--light" aria-hidden />
        </div>
      ) : (
        <>
          <div className="leaderboard-podium__slot leaderboard-podium__slot--second">
            <span className="leaderboard-podium__name">
              {second ? getLeaderboardDisplayName(second) : "—"}
            </span>
            {second ? (
              <span className="leaderboard-podium__meta">
                {formatLeaderboardAddress(second.userAddress)}
              </span>
            ) : null}
          </div>

          <div className="leaderboard-podium__slot leaderboard-podium__slot--first">
            <span className="leaderboard-podium__name">
              {first ? getLeaderboardDisplayName(first) : "—"}
            </span>
            {first ? (
              <span className="leaderboard-podium__meta">
                {formatLeaderboardAddress(first.userAddress)}
              </span>
            ) : null}
          </div>

          <div className="leaderboard-podium__slot leaderboard-podium__slot--third">
            <span className="leaderboard-podium__name">
              {third ? getLeaderboardDisplayName(third) : "—"}
            </span>
            {third ? (
              <span className="leaderboard-podium__meta">
                {formatLeaderboardAddress(third.userAddress)}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
