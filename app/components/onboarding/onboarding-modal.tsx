import { useEffect } from "react";

import { OnboardingFlow } from "~/components/onboarding/onboarding-flow";
import { useOnboarding } from "~/components/onboarding/onboarding-context";

export function OnboardingModal() {
  const { isOpen, session, markComplete, closeOnboarding } = useOnboarding();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOnboarding();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [closeOnboarding, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="onboarding-overlay" role="presentation">
      <div className="onboarding-modal" role="dialog" aria-modal="true" aria-label="Welcome to Hedge">
        <button
          type="button"
          className="onboarding-modal__close"
          onClick={closeOnboarding}
          aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="onboarding-modal__panel">
          <OnboardingFlow key={session} onComplete={markComplete} />
        </div>
        <div className="onboarding-modal__art" aria-hidden />
      </div>
    </div>
  );
}
