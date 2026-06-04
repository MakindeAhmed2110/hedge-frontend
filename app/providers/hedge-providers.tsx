import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { AuthGate } from "~/components/auth/auth-gate";
import { AuthModalProvider } from "~/components/auth/auth-modal-context";
import { HedgeAuthModal } from "~/components/auth/hedge-auth-modal";
import { OnboardingModal } from "~/components/onboarding/onboarding-modal";
import { OnboardingProvider } from "~/components/onboarding/onboarding-context";
import { HedgeBootstrap } from "~/components/providers/hedge-bootstrap";
import i18n from "~/lib/i18n";

const appId = import.meta.env.VITE_PRIVY_APP_ID ?? "";
const clientId = import.meta.env.VITE_PRIVY_CLIENT_ID ?? "";

export function HedgeProviders({ children }: { children: ReactNode }) {
  if (!appId) {
    return (
      <I18nextProvider i18n={i18n}>
        <div className="env-missing">
          <p>
            Add <code>VITE_PRIVY_APP_ID</code> and <code>VITE_PRIVY_CLIENT_ID</code> to{" "}
            <code>.env</code> (see <code>.env.example</code>).
          </p>
          {children}
        </div>
      </I18nextProvider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId || undefined}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#1E6EF3",
          logo: "/assets/images/logo-icon-blue.png",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}>
      <I18nextProvider i18n={i18n}>
        <AuthModalProvider>
          <OnboardingProvider>
            <HedgeBootstrap>
              <AuthGate />
              {children}
            </HedgeBootstrap>
            <OnboardingModal />
            <HedgeAuthModal />
          </OnboardingProvider>
        </AuthModalProvider>
      </I18nextProvider>
    </PrivyProvider>
  );
}
