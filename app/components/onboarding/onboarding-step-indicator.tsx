import { HedgeColors } from "~/constants/brand";

export type OnboardingPhase = "referral" | "email" | "username";

const STEPS: { phase: OnboardingPhase; label: string }[] = [
  { phase: "referral", label: "Referral" },
  { phase: "email", label: "Email" },
  { phase: "username", label: "Handle" },
];

function ReferralIcon({ active }: { active: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke={active ? HedgeColors.primary : "#C5CAD3"} strokeWidth="2" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke={active ? HedgeColors.primary : "#C5CAD3"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon({ active }: { active: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke={active ? HedgeColors.primary : "#C5CAD3"}
        strokeWidth="2"
      />
      <path
        d="M3 8l9 6 9-6"
        stroke={active ? HedgeColors.primary : "#C5CAD3"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandleIcon({ active }: { active: boolean }) {
  const color = active ? HedgeColors.primary : "#C5CAD3";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path
        d="M9 13.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5M8 16h8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5v1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS = {
  referral: ReferralIcon,
  email: EmailIcon,
  username: HandleIcon,
} as const;

type OnboardingStepIndicatorProps = {
  activePhase: OnboardingPhase;
};

export function OnboardingStepIndicator({ activePhase }: OnboardingStepIndicatorProps) {
  return (
    <div className="onboarding-steps" role="list" aria-label="Onboarding progress">
      {STEPS.map((step) => {
        const active = step.phase === activePhase;
        const Icon = ICONS[step.phase];
        return (
          <div
            key={step.phase}
            role="listitem"
            className={active ? "onboarding-steps__item onboarding-steps__item--active" : "onboarding-steps__item"}
            aria-current={active ? "step" : undefined}
            aria-label={step.label}>
            <Icon active={active} />
          </div>
        );
      })}
    </div>
  );
}
