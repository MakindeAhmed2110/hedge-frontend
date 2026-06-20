import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { HedgeLpPromoIcon } from "~/components/vaults/hedge-lp-promo-icon";

const STORAGE_KEY = "hedge-lp-promo-dismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function dismiss(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
}

export function HedgeLpPromoBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <aside className="hedge-lp-promo-banner" aria-label={t("vaults.lpPromoTitle")}>
      <button
        type="button"
        className="hedge-lp-promo-banner__close"
        onClick={handleDismiss}
        aria-label={t("common.close")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className="hedge-lp-promo-banner__badge">{t("vaults.lpPromoBadge")}</span>

      <div className="hedge-lp-promo-banner__icon">
        <HedgeLpPromoIcon />
      </div>

      <h2 className="hedge-lp-promo-banner__title">{t("vaults.lpPromoTitle")}</h2>
      <p className="hedge-lp-promo-banner__subtitle">{t("vaults.lpPromoSubtitle")}</p>

      <Link to="/vaults" className="hedge-lp-promo-banner__cta" onClick={dismiss}>
        {t("vaults.lpPromoCta")}
      </Link>
    </aside>
  );
}
