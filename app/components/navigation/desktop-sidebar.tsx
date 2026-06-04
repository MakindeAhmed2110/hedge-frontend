import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";

import { GetStartedButton } from "~/components/onboarding/get-started-button";
import { SIDE_MENU_ITEMS } from "~/constants/side-menu";
import { HedgeColors } from "~/constants/brand";

export function DesktopSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { authenticated, user } = usePrivy();

  return (
    <aside className="hedge-sidebar">
      <Link to="/play" className="flex items-center gap-2.5 px-2 mb-6 no-underline">
        <img
          src="/assets/images/logo-icon-blue.png"
          alt="Hedge"
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-xl font-bold tracking-tight" style={{ color: HedgeColors.black }}>
          Hedge
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5 flex-1">
        {SIDE_MENU_ITEMS.map(({ id, labelKey, Icon, href }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={id}
              to={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline text-[15px] font-semibold transition-colors ${
                active
                  ? "bg-[rgba(30,110,243,0.08)] text-hedge-primary"
                  : "text-hedge-muted hover:bg-hedge-surface"
              }`}>
              <Icon width={22} height={22} aria-hidden />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-hedge-border">
        {authenticated ? (
          <p className="text-xs text-hedge-muted px-2 truncate">
            {user?.email?.address ?? "Connected"}
          </p>
        ) : (
          <GetStartedButton variant="pill" className="w-full" />
        )}
      </div>
    </aside>
  );
}
