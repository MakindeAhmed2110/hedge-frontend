import { useTranslation } from "react-i18next";

import { PointsCardPreview } from "~/components/points/points-card-preview";
import { HedgeOverlay } from "~/components/ui/hedge-overlay";

type CustomizePointsCardModalProps = {
  open: boolean;
  onClose: () => void;
  points: number;
  handle?: string | null;
};

export function CustomizePointsCardModal({
  open,
  onClose,
  points,
  handle,
}: CustomizePointsCardModalProps) {
  const { t } = useTranslation();

  return (
    <HedgeOverlay open={open} onClose={onClose} title={t("points.customizeSheetTitle")}>
      <div className="points-customize-sheet">
        <PointsCardPreview points={points} handle={handle} size="large" />
        <p className="points-customize-sheet__hint">{t("points.customizeComingSoon")}</p>
        <button type="button" className="hedge-btn-primary" onClick={onClose}>
          {t("points.customizeGotIt")}
        </button>
      </div>
    </HedgeOverlay>
  );
}
