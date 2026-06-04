import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { ReferralEarnPoints } from "~/components/referrals/referral-earn-points";
import { TabEmptyState } from "~/components/ui/tab-empty-state";
import { useHedgeReferrals } from "~/hooks/use-hedge-referrals";

export default function ReferralsRoute() {
  const { t } = useTranslation();
  const {
    profile,
    referrals,
    isLoading,
    isRefreshing,
    error,
    needsRegister,
    applyReferral,
    isApplying,
    refetch,
  } = useHedgeReferrals();
  const [code, setCode] = useState("");

  const shareUrl = profile?.referralUrl ?? null;
  const friendsCount = referrals?.totalReferrals ?? 0;

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hedge",
          text: t("referrals.shareMessage", { url: shareUrl }),
          url: shareUrl,
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    window.alert(t("referrals.copiedBody"));
  }, [shareUrl, t]);

  return (
    <HedgePageModalShell
      title={t("referrals.heroTitle")}
      subtitle={t("referrals.heroSubtitle")}
      requireAuth
      onRefresh={() => void refetch()}
      isRefreshing={isRefreshing}>
      {isLoading && !profile && !needsRegister ? (
        <div className="hedge-page__centered">
          <span className="portfolio-assets__spinner" aria-hidden />
        </div>
      ) : error ? (
        <TabEmptyState icon="cloud" title={t("referrals.loadError")} message={error} />
      ) : needsRegister ? (
        <div className="glass-card">
          <h2 className="referrals-card__title">{t("referrals.registerTitle")}</h2>
          <p className="referrals-card__body">{t("referrals.registerBody")}</p>
        </div>
      ) : (
        <div className="hedge-page__stack">
          <div className="glass-card referrals-share-card">
            <div className="referrals-friends-box">
              <p className="referrals-friends-box__label m-0">{t("referrals.friendsReferred")}</p>
              <p className="referrals-friends-box__count m-0">{friendsCount}</p>
            </div>

            <h2 className="referrals-card__title">{t("referrals.shareCardTitle")}</h2>
            <p className="referrals-card__body">{t("referrals.shareCardBody")}</p>

            {shareUrl ? (
              <p className="referrals-link-preview m-0">{shareUrl}</p>
            ) : null}

            <div className="referrals-share-actions">
              <button
                type="button"
                className="hedge-btn-primary"
                disabled={!shareUrl}
                onClick={() => void handleShare()}>
                {t("referrals.share")}
              </button>
              {shareUrl ? (
                <button
                  type="button"
                  className="hedge-btn-secondary"
                  onClick={() => void navigator.clipboard.writeText(shareUrl)}>
                  {t("referrals.copy")}
                </button>
              ) : null}
            </div>
          </div>

          {!profile?.hasReferrer ? (
            <div className="glass-card referrals-apply-card">
              <h2 className="referrals-card__title">{t("referrals.applyTitle")}</h2>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("referrals.applyPlaceholder")}
                className="referrals-apply-input"
              />
              <button
                type="button"
                className="hedge-btn-primary"
                disabled={isApplying}
                onClick={() => void applyReferral(code).then(() => refetch())}>
                {t("referrals.applyCta")}
              </button>
            </div>
          ) : null}

          <ReferralEarnPoints />
        </div>
      )}
    </HedgePageModalShell>
  );
}
