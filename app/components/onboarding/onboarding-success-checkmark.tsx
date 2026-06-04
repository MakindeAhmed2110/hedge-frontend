export function OnboardingSuccessCheckmark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      className={size === "lg" ? "onboarding-check onboarding-check--lg" : "onboarding-check"}
      role="img"
      aria-label="Success">
      <span className="onboarding-check__ring">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 12l4 4 8-9"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
