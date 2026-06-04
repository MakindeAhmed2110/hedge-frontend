import { useTranslation } from "react-i18next";

import { VaultChipRow, VaultInfoChip } from "~/components/vaults/vault-info-chip";
import { formatPredictQuote } from "~/lib/predict/format";

type PositionsSummaryCardProps = {
  markValueUsd: number;
  openCount: number;
  unrealizedPnl: number;
  isLoading?: boolean;
};

export function PositionsSummaryCard({
  markValueUsd,
  openCount,
  unrealizedPnl,
  isLoading,
}: PositionsSummaryCardProps) {
  const { t } = useTranslation();
  const pnlPositive = unrealizedPnl >= 0;

  return (
    <div className="positions-summary-card">
      <h2 className="positions-summary-card__title">{t("positions.portfolioTitle")}</h2>
      <p className="positions-summary-card__lead">{t("positions.portfolioLead")}</p>

      {isLoading ? (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : (
        <>
          <div className="positions-summary-card__hero">
            <p className="positions-summary-card__hero-value">
              ${formatPredictQuote(markValueUsd)}
            </p>
            <p className="positions-summary-card__hero-label">{t("positions.positionValue")}</p>
          </div>
          <VaultChipRow>
            <VaultInfoChip label={`${t("positions.openCount")} ${openCount}`} accent />
            <VaultInfoChip
              label={`${t("positions.unrealizedPnl")} ${pnlPositive ? "+" : ""}$${formatPredictQuote(unrealizedPnl)}`}
              accent={pnlPositive}
              strong={!pnlPositive}
            />
          </VaultChipRow>
        </>
      )}
    </div>
  );
}
