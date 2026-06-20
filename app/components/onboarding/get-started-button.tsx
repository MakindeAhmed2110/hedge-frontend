import { useTranslation } from "react-i18next";

import { useOnboarding } from "~/components/onboarding/onboarding-context";
import { useAppUsername } from "~/hooks/use-app-username";
import { usePrivy } from "@privy-io/react-auth";

type GetStartedButtonProps = {
  /** Compact circle icon for header; full pill for sidebar. */
  variant?: "icon" | "pill";
  className?: string;
};

export function GetStartedButton({ variant = "icon", className = "" }: GetStartedButtonProps) {
  const { t } = useTranslation();
  const { ready } = usePrivy();
  const { hasUsername, isLoading } = useAppUsername();
  const { openOnboarding } = useOnboarding();

  if (!ready || isLoading || hasUsername) return null;

  const label = t("onboarding.getStarted");

  if (variant === "pill") {
    return (
      <button
        type="button"
        className={`get-started-btn get-started-btn--pill ${className}`.trim()}
        onClick={openOnboarding}>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`get-started-btn get-started-btn--icon ${className}`.trim()}
      onClick={openOnboarding}
      aria-label={label}
      title={label}>
      <span className="get-started-btn__bar" aria-hidden />
    </button>
  );
}
