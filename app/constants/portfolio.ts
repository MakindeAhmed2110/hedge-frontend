import type { SendTokenId } from "~/constants/send-tokens";

export type PortfolioBalanceViewId = SendTokenId | "all";

export const PORTFOLIO_ALL_VIEW = {
  id: "all" as const,
  label: "All",
  subtitle: "All assets (USD)",
  icon: "/assets/images/logo-icon-blue.png",
};
