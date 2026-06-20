import { usePrivy } from "@privy-io/react-auth";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useOnboarding } from "~/components/onboarding/onboarding-context";
import { HedgeLpPromoIcon } from "~/components/vaults/hedge-lp-promo-icon";

export function HedgeLpPromoBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authenticated } = usePrivy();
  const { openOnboarding } = useOnboarding();

  const handleDeploy = () => {
    if (!authenticated) {
      openOnboarding();
      return;
    }
    navigate("/vaults");
  };

  return (
    <aside className="hedge-lp-promo-banner" aria-label={t("vaults.lpPromoTitle")}>
      <span className="hedge-lp-promo-banner__badge">{t("vaults.lpPromoBadge")}</span>

      <div className="hedge-lp-promo-banner__icon">
        <HedgeLpPromoIcon />
      </div>

      <h2 className="hedge-lp-promo-banner__title">{t("vaults.lpPromoTitle")}</h2>
      <p className="hedge-lp-promo-banner__subtitle">{t("vaults.lpPromoSubtitle")}</p>

      <button type="button" className="hedge-lp-promo-banner__cta" onClick={handleDeploy}>
        {t("vaults.lpPromoCta")}
      </button>
    </aside>
  );
}
