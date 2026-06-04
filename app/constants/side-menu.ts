import type { ComponentType, SVGProps } from "react";

import MenuEventsIcon from "~/assets/images/menu/events.svg?react";
import MenuHistoryIcon from "~/assets/images/menu/history.svg?react";
import MenuHomeIcon from "~/assets/images/menu/home.svg?react";
import MenuLeaderboardIcon from "~/assets/images/menu/leaderboard.svg?react";
import MenuPointsIcon from "~/assets/images/menu/points.svg?react";
import MenuReferralsIcon from "~/assets/images/menu/referrals.svg?react";
import MenuPredictIcon from "~/assets/images/menu/predict.svg?react";
import MenuPositionsIcon from "~/assets/images/bottom-tabs/positions.svg?react";
import MenuVaultIcon from "~/assets/images/menu/vault.svg?react";

export type SideMenuItemId =
  | "home"
  | "predict"
  | "positions"
  | "vault"
  | "history"
  | "points"
  | "referrals"
  | "leaderboard"
  | "events";

export type SideMenuItem = {
  id: SideMenuItemId;
  labelKey: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
};

export const SIDE_MENU_ITEMS: SideMenuItem[] = [
  { id: "home", labelKey: "menu.home", Icon: MenuHomeIcon, href: "/portfolio" },
  { id: "predict", labelKey: "menu.predict", Icon: MenuPredictIcon, href: "/play" },
  { id: "positions", labelKey: "menu.positions", Icon: MenuPositionsIcon, href: "/positions" },
  { id: "vault", labelKey: "menu.vault", Icon: MenuVaultIcon, href: "/vaults" },
  { id: "history", labelKey: "menu.history", Icon: MenuHistoryIcon, href: "/history" },
  { id: "points", labelKey: "menu.points", Icon: MenuPointsIcon, href: "/points" },
  {
    id: "referrals",
    labelKey: "menu.referrals",
    Icon: MenuReferralsIcon,
    href: "/referrals",
  },
  {
    id: "leaderboard",
    labelKey: "menu.leaderboard",
    Icon: MenuLeaderboardIcon,
    href: "/leaderboard",
  },
  { id: "events", labelKey: "menu.events", Icon: MenuEventsIcon, href: "/events" },
];

export const PRODUCT_TABS = [
  { id: "portfolio", route: "/portfolio", labelKey: "tabs.portfolio" },
  { id: "vaults", route: "/vaults", labelKey: "tabs.vaults" },
  { id: "play", route: "/play", labelKey: "tabs.play", center: true },
  { id: "positions", route: "/positions", labelKey: "tabs.positions" },
  { id: "rep", route: "/rep", labelKey: "tabs.rep" },
] as const;
