import { useTranslation } from "react-i18next";

import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import {
  PORTFOLIO_ALL_VIEW,
  type PortfolioBalanceViewId,
} from "~/constants/portfolio";
import { SEND_TOKEN_LIST } from "~/constants/send-tokens";
import { HedgeColors } from "~/constants/brand";

type PortfolioBalancePickerProps = {
  open: boolean;
  selectedId: PortfolioBalanceViewId;
  onClose: () => void;
  onSelect: (viewId: PortfolioBalanceViewId) => void;
};

export function PortfolioBalancePicker({
  open,
  selectedId,
  onClose,
  onSelect,
}: PortfolioBalancePickerProps) {
  const { t } = useTranslation();

  return (
    <HedgeOverlay open={open} onClose={onClose} title={t("portfolio.selectBalanceView")}>
      <div className="portfolio-picker">
        <PickerRow
          active={selectedId === PORTFOLIO_ALL_VIEW.id}
          icon={PORTFOLIO_ALL_VIEW.icon}
          symbol={PORTFOLIO_ALL_VIEW.label}
          name={t("portfolio.allAssetsUsd")}
          onPress={() => {
            onSelect(PORTFOLIO_ALL_VIEW.id);
            onClose();
          }}
        />
        {SEND_TOKEN_LIST.map((token) => (
          <PickerRow
            key={token.id}
            active={token.id === selectedId}
            icon={token.icon}
            symbol={token.symbol}
            name={token.name}
            onPress={() => {
              onSelect(token.id);
              onClose();
            }}
          />
        ))}
      </div>
    </HedgeOverlay>
  );
}

function PickerRow({
  active,
  icon,
  symbol,
  name,
  onPress,
}: {
  active: boolean;
  icon: string;
  symbol: string;
  name: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "portfolio-picker__row portfolio-picker__row--active" : "portfolio-picker__row"}
      onClick={onPress}>
      <img src={icon} alt="" className="portfolio-picker__icon" />
      <div className="portfolio-picker__text">
        <span className="portfolio-picker__symbol">{symbol}</span>
        <span className="portfolio-picker__name">{name}</span>
      </div>
      {active ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" fill={HedgeColors.primary} />
          <path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}
