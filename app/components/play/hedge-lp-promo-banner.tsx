import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { HedgeLpPromoIcon } from "~/components/vaults/hedge-lp-promo-icon";

export function HedgeLpPromoBanner() {
  const { t } = useTranslation();

  return (
    <aside className="hedge-lp-promo-banner" aria-label={t("vaults.lpPromoTitle")}>
      <span className="hedge-lp-promo-banner__badge">{t("vaults.lpPromoBadge")}</span>

      <div className="hedge-lp-promo-banner__icon">
        <HedgeLpPromoIcon />
      </div>

      <h2 className="hedge-lp-promo-banner__title">{t("vaults.lpPromoTitle")}</h2>
      <p className="hedge-lp-promo-banner__subtitle">{t("vaults.lpPromoSubtitle")}</p>

      <Link to="/vaults" className="hedge-lp-promo-banner__cta">
        {t("vaults.lpPromoCta")}
      </Link>
    </aside>
  );
}
