import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import type { SendTokenConfig, SendTokenId } from "~/constants/send-tokens";
import { SEND_TOKEN_LIST } from "~/constants/send-tokens";
import { HedgeColors } from "~/constants/brand";

type SendTokenPickerProps = {
  open: boolean;
  selectedId: SendTokenId;
  title?: string;
  onClose: () => void;
  onSelect: (token: SendTokenConfig) => void;
};

export function SendTokenPicker({
  open,
  selectedId,
  title = "Select token",
  onClose,
  onSelect,
}: SendTokenPickerProps) {
  return (
    <HedgeOverlay open={open} onClose={onClose} title={title}>
      <div className="portfolio-picker">
        {SEND_TOKEN_LIST.map((token) => {
          const active = token.id === selectedId;
          return (
            <button
              key={token.id}
              type="button"
              className={
                active
                  ? "portfolio-picker__row portfolio-picker__row--active"
                  : "portfolio-picker__row"
              }
              onClick={() => {
                onSelect(token);
                onClose();
              }}>
              <img src={token.icon} alt="" className="portfolio-picker__icon" />
              <div className="portfolio-picker__text">
                <span className="portfolio-picker__symbol">{token.symbol}</span>
                <span className="portfolio-picker__name">{token.name}</span>
              </div>
              {active ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" fill={HedgeColors.primary} />
                  <path
                    d="M8 12l3 3 5-6"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </HedgeOverlay>
  );
}
