import { PointIcon } from "~/components/points/point-icon";
import { formatLeaderboardPoints } from "~/lib/leaderboard/format";

type PointsCardPreviewProps = {
  points: number;
  handle?: string | null;
  size?: "small" | "large";
};

export function PointsCardPreview({
  points,
  handle,
  size = "large",
}: PointsCardPreviewProps) {
  const large = size === "large";

  return (
    <div
      className={
        large ? "points-card-preview points-card-preview--large" : "points-card-preview"
      }>
      <p className="points-card-preview__brand">Hedge{"\n"}Points Card</p>
      <div className="points-card-preview__value-row">
        <PointIcon size={large ? 40 : 24} color="#fff" />
        <span className="points-card-preview__value">
          {formatLeaderboardPoints(points)}
        </span>
      </div>
      {handle ? <p className="points-card-preview__handle">@{handle}</p> : null}
    </div>
  );
}
