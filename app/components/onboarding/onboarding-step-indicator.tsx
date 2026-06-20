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
    <svg width={24} height={24} viewBox="0 0 33 31" fill="none" aria-hidden>
      <path
        d="M14.3525 10.3777C12.1403 10.3777 10.8094 12.1403 10.8094 15.1079C10.8094 18.0396 12.1403 19.8381 14.3345 19.8381C16.6007 19.8381 18.0576 18.0036 18.0576 15.1079C18.0576 12.2122 16.6187 10.3777 14.3525 10.3777ZM14.982 0C23.3993 0 29.4245 5.32374 29.4245 13.2734C29.4245 19.0108 26.8345 22.7698 22.554 22.7698C20.4496 22.7698 18.705 21.6007 18.4173 19.8201H18.2374C17.482 21.6367 15.8633 22.6439 13.759 22.6439C10.018 22.6439 7.5 19.5863 7.5 15.018C7.5 10.6475 10.036 7.6259 13.6871 7.6259C15.6115 7.6259 17.3201 8.61511 18.0036 10.1619H18.2014V7.98561H21.241V18.2014C21.241 19.3885 21.8705 20.1978 23.1655 20.1978C25.1619 20.1978 26.6187 17.7158 26.6187 13.3633C26.6187 6.81655 21.8165 2.48201 14.7842 2.48201C7.80576 2.48201 2.80576 7.69784 2.80576 15.1079C2.80576 23.0396 8.09353 27.5 15.3957 27.5C17.6259 27.5 19.9101 27.1942 21.0252 26.7266V29.2086C19.4964 29.7122 17.464 30 15.2698 30C6.38489 30 0 24.5324 0 15C0 6.04317 6.15108 0 14.982 0Z"
        fill={color}
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
