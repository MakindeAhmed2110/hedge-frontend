import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { PRODUCT_TABS } from "~/constants/side-menu";
import HomeIcon from "~/assets/images/bottom-tabs/home.svg?react";
import PiggyBankIcon from "~/assets/images/bottom-tabs/piggy-bank.svg?react";
import PositionsIcon from "~/assets/images/bottom-tabs/positions.svg?react";
import ClockIcon from "~/assets/images/bottom-tabs/clock.svg?react";
import FlameIcon from "~/assets/icons/flame.svg?react";
import { HedgeColors } from "~/constants/brand";

const TAB_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  portfolio: HomeIcon,
  vaults: PiggyBankIcon,
  play: FlameIcon,
  positions: PositionsIcon,
  rep: ClockIcon,
};

export function MobileTabBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="hedge-tab-bar" aria-label="Main">
      {PRODUCT_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const active = pathname === tab.route || pathname.startsWith(`${tab.route}/`);
        const isCenter = "center" in tab && tab.center;
        const color = isCenter || active ? HedgeColors.primary : "rgba(18,18,18,0.4)";

        return (
          <Link
            key={tab.id}
            to={tab.route}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-underline min-h-[56px]">
            {Icon ? <Icon width={isCenter ? 24 : 22} height={isCenter ? 24 : 22} color={color} /> : null}
            <span
              className="text-[10px] font-semibold"
              style={{ color: isCenter || active ? HedgeColors.primary : "rgba(18,18,18,0.45)" }}>
              {t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
