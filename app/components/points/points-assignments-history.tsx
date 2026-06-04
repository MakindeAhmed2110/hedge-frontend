import { useTranslation } from "react-i18next";

import { formatLeaderboardPoints } from "~/lib/leaderboard/format";

type PointsAssignmentsHistoryProps = {
  entries: Array<{ date: string; points: number }>;
};

export function PointsAssignmentsHistory({ entries }: PointsAssignmentsHistoryProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="points-assignments">
      <h2 className="points-assignments__title">{t("points.assignmentsHistory")}</h2>
      <ul className="points-assignments__list">
        {entries.map((row) => (
          <li key={row.date} className="points-assignments__row">
            <span className="points-assignments__amount">
              + {formatLeaderboardPoints(row.points)} pts
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
