import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";

import { SignInRequired } from "~/components/auth/sign-in-required";
import { HedgeOverlay } from "~/components/ui/hedge-overlay";
import { SendTokenPicker } from "~/components/send/send-token-picker";
import { usePrivy } from "@privy-io/react-auth";
import { SUI_NETWORK_IMAGE } from "~/constants/receive";
import { SEND_TOKENS, type SendTokenId } from "~/constants/send-tokens";
import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { getSuiAddressFromUser } from "~/lib/privy/user-accounts";
import { requestTestnetSui } from "~/lib/sui/faucet";

type ReceiveOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function formatAddress(address: string | null | undefined): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ReceiveOverlay({ open, onClose }: ReceiveOverlayProps) {
  const { t } = useTranslation();
  const { authenticated, ready: privyReady } = usePrivy();
  const { user, isReady, suiAddress, hasSuiWallet } = useSuiAccount();
  const { ensureSuiWallet } = useEnsureSuiWallet();

  const [displayAddress, setDisplayAddress] = useState<string | null>(suiAddress);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFaucetRequesting, setIsFaucetRequesting] = useState(false);
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<SendTokenId>("dusdc");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const selectedToken = SEND_TOKENS[selectedTokenId];

  useEffect(() => {
    setDisplayAddress(suiAddress);
  }, [suiAddress]);

  const provisionWallet = useCallback(async () => {
    if (!user) return;
    setIsProvisioning(true);
    try {
      const updatedUser = await ensureSuiWallet();
      setDisplayAddress(getSuiAddressFromUser(updatedUser));
    } catch {
      window.alert(t("receive.walletError"));
    } finally {
      setIsProvisioning(false);
    }
  }, [ensureSuiWallet, t, user]);

  useEffect(() => {
    if (!open || !isReady || !user || hasSuiWallet) return;
    void provisionWallet();
  }, [hasSuiWallet, isReady, open, provisionWallet, user]);

  useEffect(() => {
    if (!displayAddress) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(displayAddress, {
      width: 320,
      margin: 1,
      color: { dark: "#121212", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [displayAddress]);

  const isLoading = isProvisioning || (hasSuiWallet && !displayAddress);

  const handleCopy = useCallback(async () => {
    if (!displayAddress) return;
    try {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [displayAddress]);

  const handleFaucet = useCallback(async () => {
    if (!displayAddress || isFaucetRequesting) return;
    setIsFaucetRequesting(true);
    try {
      await requestTestnetSui(displayAddress);
      window.alert(t("receive.faucetSuccess"));
    } catch {
      window.alert(t("receive.faucetError"));
    } finally {
      setIsFaucetRequesting(false);
    }
  }, [displayAddress, isFaucetRequesting, t]);

  const footer = (
    <div className="receive-overlay__footer">
      <button
        type="button"
        className="receive-overlay__faucet"
        disabled={!displayAddress || isLoading || isFaucetRequesting}
        onClick={() => void handleFaucet()}>
        {isFaucetRequesting ? (
          <span className="portfolio-assets__spinner" aria-hidden />
        ) : (
          t("receive.faucet")
        )}
      </button>
      <button
        type="button"
        className="receive-overlay__copy"
        disabled={!displayAddress || isLoading}
        onClick={() => void handleCopy()}>
        {isLoading ? t("receive.loading") : t("receive.copyAddress")}
      </button>
    </div>
  );

  if (!open) return null;

  const showSignIn = privyReady && !authenticated;

  return (
    <>
      <HedgeOverlay
        open={open}
        onClose={onClose}
        title={t("receive.title")}
        footer={showSignIn ? undefined : footer}>
        {showSignIn ? (
          <SignInRequired message={t("auth.signInRequiredBody")} />
        ) : !isReady || !user ? (
          <div className="hedge-page__centered">
            <span className="portfolio-assets__spinner" aria-hidden />
          </div>
        ) : (
        <div className="receive-overlay__content">
          <div className="receive-overlay__tabs">
            <span className="receive-overlay__tab receive-overlay__tab--active">
              {t("receive.standard")}
            </span>
            <span className="receive-overlay__tab receive-overlay__tab--disabled">
              {t("receive.incognito")}
            </span>
          </div>

          <div className="receive-overlay__qr-card">
            {isLoading ? (
              <div className="receive-overlay__qr-loading">
                <span className="portfolio-assets__spinner" aria-hidden />
                <p>{t("receive.generating")}</p>
              </div>
            ) : displayAddress && qrDataUrl ? (
              <img src={qrDataUrl} alt="Deposit QR code" className="receive-overlay__qr" />
            ) : (
              <p className="receive-overlay__qr-empty">{t("receive.noWallet")}</p>
            )}
          </div>

          <div className="receive-overlay__address-block">
            {copied ? (
              <span className="receive-overlay__copied">{t("receive.copied")}</span>
            ) : null}
            <button
              type="button"
              className="receive-overlay__address-row"
              disabled={!displayAddress || isLoading}
              onClick={() => void handleCopy()}>
              {isLoading ? (
                <span className="receive-overlay__muted">{t("receive.loading")}</span>
              ) : displayAddress ? (
                <>
                  <span>{formatAddress(displayAddress)}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="8" y="8" width="12" height="12" rx="2" stroke="#121212" strokeWidth="1.8" />
                    <path d="M6 14V6a2 2 0 012-2h8" stroke="#121212" strokeWidth="1.8" />
                  </svg>
                </>
              ) : (
                <span className="receive-overlay__muted">{t("receive.noAddress")}</span>
              )}
            </button>
          </div>

          <p className="receive-overlay__helper">
            {t("receive.helper", { symbol: selectedToken.symbol })}
          </p>

          <div className="receive-overlay__options">
            <div className="receive-overlay__option">
              <img src={SUI_NETWORK_IMAGE} alt="" />
              <div>
                <span className="receive-overlay__option-label">{t("receive.network")}</span>
                <span className="receive-overlay__option-value">
                  {t("receive.networkValue")}
                  <small>{t("receive.networkTag")}</small>
                </span>
              </div>
            </div>
            <button
              type="button"
              className="receive-overlay__option receive-overlay__option--clickable"
              onClick={() => setTokenPickerOpen(true)}>
              <img src={selectedToken.icon} alt="" />
              <div>
                <span className="receive-overlay__option-label">{t("receive.asset")}</span>
                <span className="receive-overlay__option-value">{selectedToken.symbol}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        )}
      </HedgeOverlay>

      <SendTokenPicker
        open={tokenPickerOpen}
        selectedId={selectedTokenId}
        title={t("receive.selectAsset")}
        onClose={() => setTokenPickerOpen(false)}
        onSelect={(token) => setSelectedTokenId(token.id)}
      />
    </>
  );
}
