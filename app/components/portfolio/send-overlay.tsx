import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { usePrivy } from "@privy-io/react-auth";

import { SignInRequired } from "~/components/auth/sign-in-required";
import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import { NumericKeypad } from "~/components/send/numeric-keypad";
import { SendAddressInput } from "~/components/send/send-address-input";
import { SendTokenPicker } from "~/components/send/send-token-picker";
import {
  SEND_TOKENS,
  SUI_GAS_RESERVE_MIST,
  type SendTokenConfig,
  type SendTokenId,
} from "~/constants/send-tokens";
import { useSendTokenBalance } from "~/hooks/use-send-token-balance";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";
import { parseAmountToRaw } from "~/lib/sui/balances";
import { sendCoin } from "~/lib/sui/send-coin";
import { SendTokenError } from "~/lib/sui/send-errors";

type SendOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function formatRawForInput(raw: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fractionStr}`;
}

function maxSendableRaw(token: SendTokenConfig, balanceRaw: bigint): bigint {
  if (token.id !== "sui") return balanceRaw;
  return balanceRaw > SUI_GAS_RESERVE_MIST ? balanceRaw - SUI_GAS_RESERVE_MIST : 0n;
}

type ResultStatus = "idle" | "processing" | "success" | "failed";

export function SendOverlay({ open, onClose }: SendOverlayProps) {
  const { t } = useTranslation();
  const { authenticated, ready: privyReady } = usePrivy();
  const { user, suiAddress, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();

  const [selectedTokenId, setSelectedTokenId] = useState<SendTokenId>("dusdc");
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const token = SEND_TOKENS[selectedTokenId];

  const { balance, isLoading: balanceLoading, refetch } = useSendTokenBalance(suiAddress, token);

  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [shake, setShake] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resultStatus, setResultStatus] = useState<ResultStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const maxAvailable = useMemo(() => {
    if (!balance) return 0;
    const raw = maxSendableRaw(token, balance.raw);
    return Number(raw) / 10 ** token.decimals;
  }, [balance, token]);

  const inputAmount = parseFloat(amountInput) || 0;
  const exceedsBalance = inputAmount > maxAvailable;
  const canSend =
    Boolean(suiAddress && user) &&
    recipient.trim().length > 0 &&
    inputAmount > 0 &&
    !exceedsBalance &&
    !isSending &&
    !balanceLoading;

  const amountDisplay = token.amountPrefix
    ? `${token.amountPrefix}${amountInput || "0"}`
    : `${amountInput || "0"} ${token.symbol}`;

  const bumpShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 300);
  };

  const handleSelectToken = useCallback((next: SendTokenConfig) => {
    setSelectedTokenId(next.id);
    setAmountInput("");
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      const current = amountInput;
      if (key === "." && current.includes(".")) return;
      if (key === "." && current === "") {
        setAmountInput("0.");
        return;
      }
      const next = current === "0" && key !== "." ? key : current + key;
      const decimalIndex = next.indexOf(".");
      if (decimalIndex !== -1 && next.length - decimalIndex > token.decimals + 1) return;
      const parsed = parseFloat(next);
      if (!Number.isNaN(parsed) && parsed > maxAvailable) {
        bumpShake();
        return;
      }
      setAmountInput(next);
    },
    [amountInput, maxAvailable, token.decimals]
  );

  const handleBackspace = useCallback(() => {
    if (amountInput.length <= 1) {
      setAmountInput("");
      return;
    }
    setAmountInput(amountInput.slice(0, -1));
  }, [amountInput]);

  const handlePercentage = useCallback(
    (fraction: number) => {
      if (!balance || maxAvailable <= 0) return;
      if (fraction === 1) {
        const raw = maxSendableRaw(token, balance.raw);
        setAmountInput(formatRawForInput(raw, token.decimals));
        return;
      }
      const value = maxAvailable * fraction;
      setAmountInput(value.toFixed(token.decimals).replace(/\.?0+$/, "") || "0");
    },
    [balance, maxAvailable, token]
  );

  const resolveSendErrorMessage = useCallback(
    (error: unknown) => {
      if (error instanceof SendTokenError) {
        const messages: Record<SendTokenError["code"], string> = {
          INVALID_ADDRESS: t("send.invalidAddress"),
          NO_BALANCE: t("send.noBalance", { symbol: token.symbol }),
          INSUFFICIENT_BALANCE: t("send.insufficientBalance"),
          NO_SUI_GAS: t("send.noSuiGas"),
          SEND_FAILED: t("send.failed"),
        };
        return error.code === "SEND_FAILED" && error.message
          ? error.message
          : messages[error.code];
      }
      return error instanceof Error ? error.message : t("send.failed");
    },
    [t, token.symbol]
  );

  const handleSend = useCallback(async () => {
    if (!canSend || !suiAddress || !user) return;
    const publicKeyStr = getSuiPublicKeyFromUser(user);
    if (!publicKeyStr) return;

    setIsSending(true);
    setSendError(null);
    setResultStatus("processing");
    try {
      await sendCoin({
        token,
        senderAddress: suiAddress,
        recipientAddress: recipient.trim(),
        amountRaw: parseAmountToRaw(amountInput, token.decimals),
        publicKeyFromPrivy: publicKeyStr,
        signRawHash,
        getAccessToken,
      });
      setResultStatus("success");
      void refetch();
    } catch (error) {
      setSendError(resolveSendErrorMessage(error));
      setResultStatus("failed");
    } finally {
      setIsSending(false);
    }
  }, [
    amountInput,
    canSend,
    getAccessToken,
    recipient,
    refetch,
    resolveSendErrorMessage,
    signRawHash,
    suiAddress,
    token,
    user,
  ]);

  const handleClose = () => {
    setResultStatus("idle");
    setSendError(null);
    onClose();
  };

  const footer =
    resultStatus === "success" || resultStatus === "failed" ? (
      <div className="send-overlay__result-footer">
        {resultStatus === "failed" && sendError ? (
          <p className="send-overlay__error">{sendError}</p>
        ) : null}
        <button
          type="button"
          className="send-overlay__submit"
          onClick={() => {
            if (resultStatus === "failed") {
              setResultStatus("idle");
              setSendError(null);
              void handleSend();
            } else {
              handleClose();
            }
          }}>
          {resultStatus === "failed" ? t("send.tryAgain") : t("send.done")}
        </button>
      </div>
    ) : (
      <button
        type="button"
        className="send-overlay__submit"
        disabled={!canSend}
        onClick={() => void handleSend()}>
        {isSending ? (
          <span className="portfolio-assets__spinner portfolio-assets__spinner--light" aria-hidden />
        ) : (
          t("send.submit")
        )}
      </button>
    );

  if (!open) return null;

  const showSignIn = privyReady && !authenticated;

  return (
    <>
      <HedgeOverlay
        open={open}
        onClose={handleClose}
        title={t("send.title")}
        footer={showSignIn ? undefined : footer}>
        {showSignIn ? (
          <SignInRequired message={t("auth.signInRequiredBody")} />
        ) : resultStatus === "processing" ? (
          <div className="send-overlay__status">
            <span className="portfolio-assets__spinner" aria-hidden />
            <p className="send-overlay__status-title">{t("send.processingTitle")}</p>
            <p className="send-overlay__status-body">{t("send.processingBody")}</p>
          </div>
        ) : resultStatus === "success" ? (
          <div className="send-overlay__status">
            <p className="send-overlay__status-title">{t("send.successTitle")}</p>
            <p className="send-overlay__status-body">
              {t("send.successBody", { symbol: token.symbol, address: recipient.slice(0, 8) })}
            </p>
          </div>
        ) : (
          <div className="send-overlay__body">
            <SendAddressInput value={recipient} onChange={setRecipient} />

            <div className="send-overlay__balance">
              <img src={token.icon} alt="" />
              <span>
                {balanceLoading
                  ? t("send.loadingBalance")
                  : t("send.available", {
                      amount: balance?.formatted ?? "0",
                      symbol: token.symbol,
                    })}
              </span>
            </div>

            <div className="send-overlay__amount">
              <p
                className={
                  exceedsBalance
                    ? "send-overlay__amount-display send-overlay__amount-display--error"
                    : shake
                      ? "send-overlay__amount-display send-overlay__amount-display--shake"
                      : "send-overlay__amount-display"
                }>
                {amountDisplay}
              </p>
              <div className="send-overlay__percents">
                <button type="button" onClick={() => handlePercentage(0.5)}>
                  50%
                </button>
                <button type="button" onClick={() => handlePercentage(1)}>
                  MAX
                </button>
              </div>
              {exceedsBalance ? (
                <p className="send-overlay__error">{t("send.insufficientBalance")}</p>
              ) : null}
              {token.id === "sui" ? (
                <p className="send-overlay__hint">{t("send.suiGasHint")}</p>
              ) : null}
            </div>

            <button
              type="button"
              className="send-overlay__token-pill"
              onClick={() => setTokenPickerOpen(true)}>
              <img src={token.icon} alt="" />
              <span>{token.symbol}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <NumericKeypad
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={() => setAmountInput("")}
            />
          </div>
        )}
      </HedgeOverlay>

      <SendTokenPicker
        open={tokenPickerOpen}
        selectedId={selectedTokenId}
        title={t("send.selectToken")}
        onClose={() => setTokenPickerOpen(false)}
        onSelect={handleSelectToken}
      />
    </>
  );
}
