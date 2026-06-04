import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MAX_BET_USD, MIN_BET_USD } from "~/constants/predict";
import {
  getMaxAffordableBetUsd,
  getQuickBetAmounts,
  parseBetAmountInput,
  validateBetAmountUsd,
  type BetAmountErrorCode,
} from "~/lib/predict/bet-amount";

type BetAmountModalProps = {
  open: boolean;
  defaultAmountUsd: number;
  walletBalanceUsd: number;
  isSubmitting?: boolean;
  onConfirm: (amountUsd: number) => void;
  onClose: () => void;
};

export function BetAmountModal({
  open,
  defaultAmountUsd,
  walletBalanceUsd,
  isSubmitting,
  onConfirm,
  onClose,
}: BetAmountModalProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);

  const initialAmount = useMemo(
    () => Math.max(MIN_BET_USD, Math.min(defaultAmountUsd, walletBalanceUsd || defaultAmountUsd)),
    [defaultAmountUsd, walletBalanceUsd]
  );

  useEffect(() => {
    if (!open) return;
    setInput(String(initialAmount));
    setTouched(false);
  }, [open, initialAmount]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold m-0 mb-4">{t("play.betPanelTitle", { pair: "BTC" })}</h2>
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTouched(true);
          }}
          className="w-full text-2xl font-bold border border-hedge-border rounded-xl px-4 py-3 mb-3"
        />
        {errorMessage ? <p className="text-red-600 text-sm">{errorMessage}</p> : null}
        <div className="flex flex-wrap gap-2 my-4">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              className="chip"
              onClick={() => {
                setInput(String(amt));
                setTouched(true);
              }}>
              ${amt}
            </button>
          ))}
          {maxAffordable >= MIN_BET_USD && !quickAmounts.includes(maxAffordable) ? (
            <button type="button" className="chip" onClick={() => setInput(String(maxAffordable))}>
              Max
            </button>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => parsed != null && onConfirm(parsed)}
          className="w-full rounded-xl py-3.5 text-white font-bold border-0 cursor-pointer disabled:opacity-50 bg-hedge-primary">
          {isSubmitting ? "…" : t("play.betUp")}
        </button>
      </div>
    </div>
  );
}
