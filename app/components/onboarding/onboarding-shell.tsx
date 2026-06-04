import type { ReactNode } from "react";

import { HedgeOnboardingBackground } from "~/components/onboarding/hedge-onboarding-background";
import {
  OnboardingStepIndicator,
  type OnboardingPhase,
} from "~/components/onboarding/onboarding-step-indicator";

type OnboardingShellProps = {
  phase: OnboardingPhase;
  stepKey: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  onBack?: () => void;
};

export function OnboardingShell({
  phase,
  stepKey,
  title,
  subtitle,
  children,
  onBack,
}: OnboardingShellProps) {
  return (
    <div className="onboarding-shell">
      <HedgeOnboardingBackground />
      <div className="onboarding-shell__content">
        {onBack ? (
          <button type="button" className="onboarding-shell__back" onClick={onBack} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}

        <div className="onboarding-shell__stage">
          <div className="onboarding-shell__hero">
            <OnboardingStepIndicator activePhase={phase} />
            <h2 key={`title-${stepKey}`} className="onboarding-shell__title">
              {title}
            </h2>
            <p key={`sub-${stepKey}`} className="onboarding-shell__subtitle">
              {subtitle}
            </p>
          </div>
          <div key={`body-${stepKey}`} className="onboarding-shell__body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
