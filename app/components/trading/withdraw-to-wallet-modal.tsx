import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatPredictQuote } from "~/lib/predict/format";
import {
  managerBalanceInputString,
  managerBalanceRawToUsd,
  parseManagerUsdInput,
  usdExceedsManagerBalance,
} from "~/lib/predict/manager-balance";

const MIN_WITHDRAW_USD = 0.01;

type WithdrawToWalletModalProps = {
  open: boolean;
  managerBalanceRaw: bigint;
  isSubmitting?: boolean;
  onConfirm: (amountUsd: number) => void;
  onClose: () => void;
};

export function WithdrawToWalletModal({
  open,
  managerBalanceRaw,
  isSubmitting,
  onConfirm,
  onClose,
}: WithdrawToWalletModalProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);

  const maxUsd = managerBalanceRawToUsd(managerBalanceRaw);
  const maxAmountInput = useMemo(
    () => managerBalanceInputString(managerBalanceRaw),
    [managerBalanceRaw]
  );

  useEffect(() => {
    if (!open) return;
    setInput(maxAmountInput);
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const parsed = parseManagerUsdInput(input);
  const validationError =
    touched || parsed != null
      ? parsed == null || parsed <= 0
        ? "invalid"
        : parsed < MIN_WITHDRAW_USD
          ? "belowMin"
          : usdExceedsManagerBalance(parsed, managerBalanceRaw)
            ? "aboveMax"
            : null
      : null;

  const errorMessage = validationError
    ? t(`predictAccount.withdrawError.${validationError}`, {
        min: MIN_WITHDRAW_USD,
        max: formatPredictQuote(Number(managerBalanceRaw)),
      })
    : null;

  const canConfirm =
    parsed != null && validationError == null && !isSubmitting && managerBalanceRaw > 0n;

  return (
    <div className="bet-amount-modal__overlay" role="presentation" onClick={onClose}>
      <div
        className="bet-amount-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("predictAccount.withdrawSheetTitle")}
        onClick={(e) => e.stopPropagation()}>
        <div className="bet-amount-modal__header">
          <div>
            <p className="bet-amount-modal__eyebrow">Predict · DUSDC</p>
            <h2 className="bet-amount-modal__title">{t("predictAccount.withdrawSheetTitle")}</h2>
          </div>
          <button
            type="button"
            className="bet-amount-modal__close"
            onClick={onClose}
            aria-label={t("common.close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="bet-amount-modal__lead">{t("predictAccount.withdrawSheetLead")}</p>

        <div className="bet-amount-modal__field">
          <span className="bet-amount-modal__currency">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setTouched(true);
            }}
            className="bet-amount-modal__input"
            placeholder="0.00"
            aria-invalid={Boolean(errorMessage)}
          />
          <span className="bet-amount-modal__field-suffix">DUSDC</span>
        </div>

        <div className="bet-amount-modal__meta">
          {errorMessage ? (
            <span className="bet-amount-modal__error">{errorMessage}</span>
          ) : (
            <span className="bet-amount-modal__balance">
              {t("predictAccount.withdrawAvailable")}: {formatPredictQuote(Number(managerBalanceRaw))} DUSDC
            </span>
          )}
        </div>

        <div className="bet-amount-modal__chips">
          <button
            type="button"
            className="bet-amount-modal__chip"
            disabled={maxUsd <= 0}
            onClick={() => {
              setInput(maxAmountInput);
              setTouched(true);
            }}>
            {t("predictAccount.withdrawMax")}
          </button>
        </div>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => parsed != null && onConfirm(parsed)}
          className="bet-amount-modal__confirm bet-amount-modal__confirm--neutral">
          {isSubmitting ? (
            <span className="bet-amount-modal__spinner" aria-hidden />
          ) : (
            <>
              {t("predictAccount.withdrawSheetConfirm")}
              {parsed != null ? (
                <span className="bet-amount-modal__confirm-amt">${parsed}</span>
              ) : null}
            </>
          )}
        </button>

        <p className="bet-amount-modal__hint">{t("predictAccount.withdrawSheetHint")}</p>
      </div>
    </div>
  );
}
