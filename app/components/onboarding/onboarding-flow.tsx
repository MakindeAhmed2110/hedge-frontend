import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import { AuthPillInput } from "~/components/auth/auth-pill-input";
import { OnboardingOtpStep } from "~/components/onboarding/onboarding-otp-step";
import { OnboardingShell } from "~/components/onboarding/onboarding-shell";
import { OnboardingWelcome } from "~/components/onboarding/onboarding-welcome";
import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";

type FlowStep = "email" | "otp" | "welcome";

type OnboardingFlowProps = {
  onComplete: () => void;
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { ready, authenticated } = usePrivy();
  const { ensureSuiWallet } = useEnsureSuiWallet();

  const [step, setStep] = useState<FlowStep>(() => (authenticated ? "welcome" : "email"));
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (err: unknown) => setLocalError(String(err)),
  });

  useEffect(() => {
    if (!ready) return;
    if (authenticated && step !== "welcome") {
      setStep("welcome");
    }
  }, [authenticated, ready, step]);

  useEffect(() => {
    if (state.status === "awaiting-code-input" && step === "email") {
      setStep("otp");
    }
    if (state.status === "error" && state.error) {
      setLocalError(String(state.error));
    }
  }, [state, step]);

  const isEmailBusy =
    state.status === "sending-code" ||
    state.status === "submitting-code" ||
    state.status === "done";

  const handleSendCode = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setLocalError("Enter a valid email address.");
      return;
    }
    setLocalError(null);
    setEmail(trimmed);
    await sendCode({ email: trimmed });
    setStep("otp");
  }, [email, sendCode]);

  const verifyOtpAndProvisionWallet = useCallback(
    async (otpCode: string) => {
      await loginWithCode({ code: otpCode });
      await ensureSuiWallet();
    },
    [ensureSuiWallet, loginWithCode]
  );

  const handleBack = useCallback(() => {
    setLocalError(null);
    if (step === "otp") setStep("email");
  }, [step]);

  if (!ready) {
    return (
      <div className="onboarding-shell onboarding-shell--loading">
        <span className="portfolio-assets__spinner" aria-hidden />
      </div>
    );
  }

  if (step === "welcome") {
    return <OnboardingWelcome onDone={onComplete} />;
  }

  if (step === "email") {
    return (
      <OnboardingShell
        stepKey="email"
        phase="email"
        title="Sign in with email"
        subtitle="Enter your email to continue">
        <AuthPillInput
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            if (localError) setLocalError(null);
          }}
          placeholder="Email"
          onSubmit={() => void handleSendCode()}
          loading={state.status === "sending-code"}
          disabled={isEmailBusy}
        />
        {localError ? <p className="onboarding-shell__error">{localError}</p> : null}
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      stepKey="otp"
      phase="email"
      title="Verify email"
      subtitle="Enter the 6-digit code we sent you"
      onBack={handleBack}>
      <OnboardingOtpStep
        email={email}
        error={localError}
        onResend={() => void handleSendCode()}
        onVerify={async (otpCode) => {
          setLocalError(null);
          await verifyOtpAndProvisionWallet(otpCode);
        }}
        onVerified={() => {
          setLocalError(null);
          setStep("welcome");
        }}
      />
    </OnboardingShell>
  );
}
