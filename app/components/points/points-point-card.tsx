import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CustomizePointsCardModal } from "~/components/points/customize-points-card-modal";
import { PointIcon } from "~/components/points/point-icon";
import { SharePointsCardModal } from "~/components/points/share-points-card-modal";
import { formatLeaderboardPoints } from "~/lib/leaderboard/format";

type PointsPointCardProps = {
  totalPoints: number;
  weeklyPoints: number;
  isLoading?: boolean;
  handle?: string | null;
  referralUrl?: string | null;
};

export function PointsPointCard({
  totalPoints,
  weeklyPoints,
  isLoading,
  handle,
  referralUrl,
}: PointsPointCardProps) {
  const { t } = useTranslation();
  const [shareOpen, setShareOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const showWeeklyBadge = !isLoading && weeklyPoints > 0;

  return (
    <>
      <div className="glass-card points-point-card">
        <div className="points-point-card__top">
          <div className="points-point-card__summary">
            <div className="points-point-card__value-row">
              <PointIcon size={35} />
              <p className="points-point-card__value">
                {isLoading ? "…" : formatLeaderboardPoints(totalPoints)}
              </p>
            </div>
            <p className="points-point-card__label">{t("points.yourPoints")}</p>
          </div>
          {showWeeklyBadge ? (
            <span className="points-point-card__badge">
              {t("points.weeklyBadge", {
                amount: formatLeaderboardPoints(weeklyPoints),
              })}
            </span>
          ) : null}
        </div>

        <hr className="points-point-card__divider" />

        <div className="points-point-card__share">
          <h2 className="points-point-card__share-title">{t("points.shareCardTitle")}</h2>
          <p className="points-point-card__share-body">{t("points.shareCardBody")}</p>
        </div>

        <div className="points-point-card__actions">
          <button
            type="button"
            className="hedge-btn-primary"
            disabled={isLoading}
            onClick={() => setShareOpen(true)}>
            {t("points.shareCard")}
          </button>
          <button
            type="button"
            className="points-point-card__customize"
            disabled={isLoading}
            onClick={() => setCustomizeOpen(true)}>
            <span>{t("points.customizeCard")}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3l1.4 4.2H18l-3.5 2.5 1.3 4.2L12 14.5 8.2 14l1.3-4.2L6 7.2h4.6L12 3z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <SharePointsCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        points={totalPoints}
        handle={handle}
        referralUrl={referralUrl}
      />
      <CustomizePointsCardModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        points={totalPoints}
        handle={handle}
      />
    </>
  );
}
