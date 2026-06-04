import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { PointsCardPreview } from "~/components/points/points-card-preview";
import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import { formatLeaderboardPoints } from "~/lib/leaderboard/format";

type SharePointsCardModalProps = {
  open: boolean;
  onClose: () => void;
  points: number;
  handle?: string | null;
  referralUrl?: string | null;
};

export function SharePointsCardModal({
  open,
  onClose,
  points,
  handle,
  referralUrl,
}: SharePointsCardModalProps) {
  const { t } = useTranslation();

  const shareMessage =
    referralUrl && handle
      ? t("points.shareMessage", {
          points: formatLeaderboardPoints(points),
          handle,
          url: referralUrl,
        })
      : t("points.shareMessageNoRef", {
          points: formatLeaderboardPoints(points),
        });

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Hedge Points",
          text: shareMessage,
          url: referralUrl ?? undefined,
        });
        onClose();
        return;
      }
      await navigator.clipboard.writeText(
        referralUrl ? `${shareMessage}\n${referralUrl}` : shareMessage
      );
      window.alert(t("points.copiedShare"));
      onClose();
    } catch {
      /* user cancelled */
    }
  }, [onClose, referralUrl, shareMessage, t]);

  return (
    <HedgeOverlay open={open} onClose={onClose} title={t("points.shareSheetTitle")}>
      <div className="points-share-sheet">
        <PointsCardPreview points={points} handle={handle} size="large" />
        <button type="button" className="hedge-btn-primary" onClick={() => void handleShare()}>
          {t("points.shareCard")}
        </button>
      </div>
    </HedgeOverlay>
  );
}
