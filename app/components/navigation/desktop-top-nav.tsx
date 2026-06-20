import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";

import { useOnboarding } from "~/components/onboarding/onboarding-context";
import { NavHamburgerMenu } from "~/components/navigation/nav-hamburger-menu";
import { UserMenu } from "~/components/navigation/user-menu";
import { useNavSearch } from "~/context/nav-search-context";
import { HedgeColors } from "~/constants/brand";

export function DesktopTopNav() {
  const { t } = useTranslation();
  const { authenticated } = usePrivy();
  const { openOnboarding } = useOnboarding();
  const { searchQuery, setSearchQuery } = useNavSearch();

  return (
    <header className="hedge-top-nav">
      <div className="hedge-top-nav__inner">
        <Link to="/play" className="hedge-top-nav__brand no-underline">
          <img
            src="/assets/images/logo-icon-blue.png"
            alt="Hedge"
            className="hedge-top-nav__brand-logo"
          />
          <span className="hedge-top-nav__brand-text" style={{ color: HedgeColors.black }}>
            Hedge
          </span>
        </Link>

        <label className="hedge-top-nav__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20l-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("nav.searchMarkets")}
            className="hedge-top-nav__search-input"
          />
          <span className="hedge-top-nav__search-hint" aria-hidden>
            /
          </span>
        </label>

        <div className="hedge-top-nav__actions">
          <Link to="/play" className="hedge-top-nav__how-it-works">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 10v6M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {t("play.howItWorks")}
          </Link>

          {!authenticated ? (
            <>
              <button type="button" className="hedge-top-nav__login" onClick={openOnboarding}>
                {t("auth.logIn")}
              </button>
              <button type="button" className="hedge-top-nav__signup" onClick={openOnboarding}>
                {t("auth.signUp")}
              </button>
            </>
          ) : (
            <UserMenu />
          )}

          <NavHamburgerMenu />
        </div>
      </div>
    </header>
  );
}
