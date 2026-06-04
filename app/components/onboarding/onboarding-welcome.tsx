import { useEffect } from "react";

import { OnboardingSuccessCheckmark } from "~/components/onboarding/onboarding-success-checkmark";
import { HedgeOnboardingBackground } from "~/components/onboarding/hedge-onboarding-background";

const AUTO_CONTINUE_MS = 2800;

type OnboardingWelcomeProps = {
  onDone: () => void;
};

export function OnboardingWelcome({ onDone }: OnboardingWelcomeProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="onboarding-welcome">
      <HedgeOnboardingBackground />
      <div className="onboarding-welcome__inner">
        <OnboardingSuccessCheckmark size="lg" />
        <h2 className="onboarding-welcome__title">Welcome to Hedge</h2>
        <p className="onboarding-welcome__note">
          You&apos;re in. Trade the move on testnet — your portfolio and play markets are ready.
        </p>
        <button type="button" className="onboarding-welcome__cta" onClick={onDone}>
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
