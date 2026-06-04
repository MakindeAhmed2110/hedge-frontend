import { useTranslation } from "react-i18next";

import type { MarketExpiryFilter } from "~/lib/predict/market-expiry-filter";
import { MARKET_EXPIRY_FILTERS } from "~/lib/predict/market-expiry-filter";

const FILTER_KEYS: Record<MarketExpiryFilter, string> = {
  all: "play.expiryFilterAll",
  "10m": "play.expiryFilter10m",
  "1h": "play.expiryFilter1h",
  "12h": "play.expiryFilter12h",
  "1d": "play.expiryFilter1d",
};

type MarketExpiryChipsProps = {
  value: MarketExpiryFilter;
  onChange: (filter: MarketExpiryFilter) => void;
  assets?: string[];
  assetFilter?: string | null;
  onAssetFilterChange?: (asset: string | null) => void;
};

export function MarketExpiryChips({
  value,
  onChange,
  assets = [],
  assetFilter,
  onAssetFilterChange,
}: MarketExpiryChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {MARKET_EXPIRY_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`chip ${value === filter ? "chip-active" : ""}`}
            onClick={() => onChange(filter)}>
            {t(FILTER_KEYS[filter])}
          </button>
        ))}
      </div>
      {assets.length > 1 && onAssetFilterChange ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            className={`chip ${!assetFilter ? "chip-active" : ""}`}
            onClick={() => onAssetFilterChange(null)}>
            All
          </button>
          {assets.map((asset) => (
            <button
              key={asset}
              type="button"
              className={`chip ${assetFilter === asset ? "chip-active" : ""}`}
              onClick={() => onAssetFilterChange(asset)}>
              {asset}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
