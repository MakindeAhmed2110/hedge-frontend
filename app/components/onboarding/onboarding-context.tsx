import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePrivy } from "@privy-io/react-auth";

import { useAppUsername } from "~/hooks/use-app-username";
import { setOnboardingDone } from "~/lib/preferences/onboarding";

type OnboardingContextValue = {
  isOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  markComplete: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { ready } = usePrivy();
  const { hasUsername, isLoading: usernameLoading } = useAppUsername();
  const [isOpen, setIsOpen] = useState(false);

  const openOnboarding = useCallback(() => {
    setIsOpen(true);
  }, []);

  const markComplete = useCallback(() => {
    void setOnboardingDone();
    setIsOpen(false);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!ready || usernameLoading) return;
    if (hasUsername) {
      void setOnboardingDone();
      setIsOpen(false);
    }
  }, [hasUsername, ready, usernameLoading]);

  const value = useMemo(
    () => ({ isOpen, openOnboarding, closeOnboarding, markComplete }),
    [closeOnboarding, isOpen, markComplete, openOnboarding]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
