import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { TradeToast } from "~/components/trading/trade-toast";
import { SEND_TOKENS } from "~/constants/send-tokens";
import { usePredictManager } from "~/hooks/use-predict-manager";
import { useRangeLadderVault } from "~/hooks/use-range-ladder-vault";
import { useSendTokenBalance } from "~/hooks/use-send-token-balance";
import { useVaultProtocolSummary } from "~/hooks/use-vault-protocol-summary";
import { useSuiAccount } from "~/hooks/use-sui-account";
import { walletBalanceToUsd } from "~/lib/predict/bet-amount";
import {
  closeRangeLadderVault,
  deployRangeLadderVault,
  PredictTradeError,
  rollRangeLadderVault,
} from "~/lib/predict/execute-predict";
import { formatPredictStrike } from "~/lib/predict/format";
import { getSuiPublicKeyFromUser } from "~/lib/privy/user-accounts";
import { hasTestnetSuiGas } from "~/lib/sui/gas-check";

export default function VaultsRoute() {
  const { t } = useTranslation();
  const { user, suiAddress, getAccessToken } = useSuiAccount();
  const { signRawHash } = useSignRawHash();
  const { summary, isLoading: vaultLoading, refetch: refetchVault } = useVaultProtocolSummary();
  const {
    deployment,
    canRoll,
    deployTarget,
    rollTarget,
    isLoading: ladderLoading,
    refetch: refetchLadder,
  } = useRangeLadderVault(suiAddress);
  const { ensureManager } = usePredictManager({
    owner: suiAddress,
    publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
    signRawHash,
    getAccessToken,
  });
  const { balance } = useSendTokenBalance(suiAddress, SEND_TOKENS.dusdc);
  const walletUsd = walletBalanceToUsd(balance?.raw);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    status: "processing" as "processing" | "success" | "error",
    message: null as string | null,
  });

  const signContext =
    suiAddress
      ? {
          senderAddress: suiAddress,
          publicKeyFromPrivy: getSuiPublicKeyFromUser(user),
          signRawHash,
          getAccessToken,
        }
      : null;

  const runVaultAction = async (label: string, fn: () => Promise<unknown>) => {
    if (!signContext) return;
    setSubmitting(true);
    setToast({ visible: true, status: "processing", message: null });
    try {
      if (!(await hasTestnetSuiGas(suiAddress!))) {
        throw new PredictTradeError("Add testnet SUI for gas fees.");
      }
      await ensureManager({ silent: true });
      await fn();
      setToast({ visible: true, status: "success", message: label });
      void refetchVault();
      void refetchLadder();
      setTimeout(() => setToast((s) => ({ ...s, visible: false })), 1400);
    } catch (err) {
      setToast({
        visible: true,
        status: "error",
        message: err instanceof Error ? err.message : "Vault action failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HedgePageModalShell
      title={t("vaults.title")}
      subtitle={t("vaults.subtitle")}
      requireAuth
      onRefresh={() => {
        void refetchVault();
        void refetchLadder();
      }}
      isRefreshing={vaultLoading || ladderLoading}>
      {vaultLoading ? (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : summary ? (
        <div className="glass-card vault-stats">
          <div>
            <p className="vault-stat__label">{t("vaults.vaultValue")}</p>
            <p className="vault-stat__value">${summary.vault_value.toFixed(2)}</p>
          </div>
          <div>
            <p className="vault-stat__label">{t("vaults.plpSharePrice")}</p>
            <p className="vault-stat__value">{summary.plp_share_price.toFixed(4)}</p>
          </div>
        </div>
      ) : null}

      <div className="glass-card">
        <h2 className="vault-section__title">{t("vaults.ladderTitle")}</h2>
        <p className="vault-section__lead">{t("vaults.ladderLead")}</p>
        {ladderLoading ? (
          <div className="hedge-page__centered">
            <span className="portfolio-assets__spinner" aria-hidden />
          </div>
        ) : deployment ? (
          <>
            <p className="vault-section__lead">
              {t("vaults.activeDeployment", { count: deployment.bands.length })}
            </p>
            <ul className="vault-bands">
              {deployment.bands.map((b) => (
                <li key={`${b.lowerStrike}-${b.higherStrike}`}>
                  ${b.stakeUsd} · {formatPredictStrike(Number(b.lowerStrike))} –{" "}
                  {formatPredictStrike(Number(b.higherStrike))}
                </li>
              ))}
            </ul>
            <div className="referrals-share-actions">
              <button
                type="button"
                disabled={submitting}
                className="hedge-btn-secondary"
                onClick={() =>
                  void runVaultAction(t("vaults.closeSuccess"), () =>
                    closeRangeLadderVault(deployment, signContext!)
                  )
                }>
                {t("vaults.closeLadder")}
              </button>
              {canRoll && rollTarget ? (
                <button
                  type="button"
                  disabled={submitting}
                  className="hedge-btn-primary"
                  onClick={() =>
                    void runVaultAction(t("vaults.rollLadder"), () =>
                      rollRangeLadderVault(
                        {
                          deployment,
                          nextCard: rollTarget,
                          totalStakeUsd: Math.min(10, walletUsd),
                        },
                        signContext!
                      )
                    )
                  }>
                  {t("vaults.rollLadder")}
                </button>
              ) : null}
            </div>
          </>
        ) : deployTarget ? (
          <button
            type="button"
            disabled={submitting}
            className="hedge-btn-primary"
            onClick={() =>
              void runVaultAction(t("vaults.deployLadder"), () =>
                deployRangeLadderVault(
                  { card: deployTarget, totalStakeUsd: Math.min(10, walletUsd) },
                  signContext!
                )
              )
            }>
            {t("vaults.deployLadder")}
          </button>
        ) : (
          <p className="vault-section__lead">{t("vaults.noDeployMarket")}</p>
        )}
      </div>

      <TradeToast visible={toast.visible} status={toast.status} message={toast.message} />
    </HedgePageModalShell>
  );
}
