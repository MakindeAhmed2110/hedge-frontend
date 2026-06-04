import { useTranslation } from "react-i18next";

import { formatPredictStrike } from "~/lib/predict/format";
import type { PredictPlayCard } from "~/lib/predict/types";

export type RangeBandOption = {
  lower: bigint;
  higher: bigint;
  label?: string;
};

type RangeMintModalProps = {
  open: boolean;
  card: PredictPlayCard | null;
  bands: RangeBandOption[];
  onSelect: (band: RangeBandOption) => void;
  onClose: () => void;
};

export function RangeMintModal({ open, card, bands, onSelect, onClose }: RangeMintModalProps) {
  const { t } = useTranslation();
  if (!open || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold m-0 mb-4">{t("play.betRange")}</h2>
        <div className="flex flex-col gap-2">
          {bands.map((band) => (
            <button
              key={`${band.lower}-${band.higher}`}
              type="button"
              className="w-full text-left rounded-xl border border-hedge-border px-4 py-3 font-semibold hover:bg-hedge-surface cursor-pointer"
              onClick={() => onSelect(band)}>
              {formatPredictStrike(band.lower)} – {formatPredictStrike(band.higher)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
