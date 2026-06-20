import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MAX_BET_USD, MIN_BET_USD } from "~/constants/predict";
import {
  getMaxAffordableBetUsd,
  getQuickBetAmounts,
  parseBetAmountInput,
  validateBetAmountUsd,
  type BetAmountErrorCode,
} from "~/lib/predict/bet-amount";

type BetDirection = "up" | "down" | "range";

type BetAmountModalProps = {
  open: boolean;
  defaultAmountUsd: number;
  walletBalanceUsd: number;
  isSubmitting?: boolean;
  /** Market pair, e.g. "BTC". */
  pair?: string;
  /** Drives the title accent + confirm button colour/label. */
  direction?: BetDirection;
  onConfirm: (amountUsd: number) => void;
  onClose: () => void;
};

/** Trim trailing zeros so 8.80 -> "8.8" and 10.00 -> "10". */
function formatAmountInput(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatBalance(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BetAmountModal({
  open,
  defaultAmountUsd,
  walletBalanceUsd,
  isSubmitting,
  pair = "BTC",
  direction = "up",
  onConfirm,
  onClose,
}: BetAmountModalProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialAmount = useMemo(() => {
    const cap = walletBalanceUsd > 0 ? walletBalanceUsd : defaultAmountUsd;
    const clamped = Math.max(MIN_BET_USD, Math.min(defaultAmountUsd, cap));
    return Math.floor(clamped * 100) / 100;
  }, [defaultAmountUsd, walletBalanceUsd]);

  // Reset + focus only when the modal transitions to open, so typing isn't clobbered
  // on every parent re-render (the inline onClose/initialAmount change identity).
  useEffect(() => {
    if (!open) return;
    setInput(formatAmountInput(initialAmount));
    setTouched(false);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(focusId);
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

  const parsed = parseBetAmountInput(input);
  const validationError: BetAmountErrorCode | null =
    touched || parsed != null ? validateBetAmountUsd(parsed ?? 0, walletBalanceUsd) : null;
  const quickAmounts = getQuickBetAmounts(walletBalanceUsd);
  const maxAffordable = getMaxAffordableBetUsd(walletBalanceUsd);
  const errorMessage = validationError
    ? t(`play.betError.${validationError}`, { min: MIN_BET_USD, max: MAX_BET_USD })
    : null;
  const canConfirm = parsed != null && validationError == null && !isSubmitting;

  const confirmLabel =
    direction === "up"
      ? t("play.betUp")
      : direction === "down"
        ? t("play.betDown")
        : t("play.confirm");

  const confirmTone =
    direction === "up"
      ? "bet-amount-modal__confirm--up"
      : direction === "down"
        ? "bet-amount-modal__confirm--down"
        : "bet-amount-modal__confirm--neutral";

  const showMax = maxAffordable >= MIN_BET_USD && !quickAmounts.includes(maxAffordable);

  return (
    <div className="bet-amount-modal__overlay" role="presentation" onClick={onClose}>
      <div
        className="bet-amount-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("play.betPanelTitle", { pair })}
        onClick={(e) => e.stopPropagation()}>
        <div className="bet-amount-modal__header">
          <div>
            <p className="bet-amount-modal__eyebrow">{pair} · Predict</p>
            <h2 className="bet-amount-modal__title">{t("play.betPanelTitle", { pair })}</h2>
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

        <button
          type="button"
          className="bet-amount-modal__field"
          onClick={() => inputRef.current?.focus()}>
          <span className="bet-amount-modal__currency">$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setTouched(true);
            }}
            className="bet-amount-modal__input"
            aria-invalid={Boolean(errorMessage)}
          />
          <span className="bet-amount-modal__field-suffix">DUSDC</span>
        </button>

        <div className="bet-amount-modal__meta">
          {errorMessage ? (
            <span className="bet-amount-modal__error">{errorMessage}</span>
          ) : (
            <span className="bet-amount-modal__balance">
              {t("play.balance", "Balance")}: ${formatBalance(walletBalanceUsd)}
            </span>
          )}
        </div>

        <div className="bet-amount-modal__chips">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              className={
                parsed === amt
                  ? "bet-amount-modal__chip bet-amount-modal__chip--active"
                  : "bet-amount-modal__chip"
              }
              onClick={() => {
                setInput(formatAmountInput(amt));
                setTouched(true);
              }}>
              ${amt}
            </button>
          ))}
          {showMax ? (
            <button
              type="button"
              className="bet-amount-modal__chip"
              onClick={() => {
                setInput(formatAmountInput(maxAffordable));
                setTouched(true);
              }}>
              {t("play.max", "Max")}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => parsed != null && onConfirm(parsed)}
          className={`bet-amount-modal__confirm ${confirmTone}`}>
          {isSubmitting ? (
            <span className="bet-amount-modal__spinner" aria-hidden />
          ) : (
            <>
              {confirmLabel}
              {parsed != null ? <span className="bet-amount-modal__confirm-amt">${formatAmountInput(parsed)}</span> : null}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
