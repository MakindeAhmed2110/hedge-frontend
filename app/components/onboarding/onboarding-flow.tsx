import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import { AuthPillInput } from "~/components/auth/auth-pill-input";
import { OnboardingOtpStep } from "~/components/onboarding/onboarding-otp-step";
import { OnboardingShell } from "~/components/onboarding/onboarding-shell";
import { OnboardingWelcome } from "~/components/onboarding/onboarding-welcome";
import { useAppUsername } from "~/hooks/use-app-username";
import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";
import { HedgeRegisterError, registerWithHedge } from "~/lib/hedge/register-with-hedge";
import { normalizeUsername, validateUsername } from "~/lib/privy/custom-metadata";
import { getStoredReferralCode, setStoredReferralCode } from "~/lib/preferences/referral";
import { getSuiAddressFromUser } from "~/lib/privy/user-accounts";

type FlowStep = "referral" | "email" | "otp" | "username" | "welcome";

type OnboardingFlowProps = {
  onComplete: () => void;
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { hasUsername, saveUsername } = useAppUsername();
  const { ensureSuiWallet } = useEnsureSuiWallet();

  const [step, setStep] = useState<FlowStep>(() =>
    authenticated ? (hasUsername ? "welcome" : "username") : "referral"
  );
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsernameInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (err: unknown) => setLocalError(String(err)),
  });

  useEffect(() => {
    if (!ready) return;
    if (authenticated && hasUsername && step !== "welcome") {
      setStep("welcome");
    } else if (authenticated && !hasUsername && step === "referral") {
      setStep("username");
    }
  }, [authenticated, hasUsername, ready, step]);

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

  const handleReferralContinue = useCallback(async () => {
    setLocalError(null);
    await setStoredReferralCode(referralCode);
    setStep("email");
  }, [referralCode]);

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

  const handleUsernameContinue = useCallback(async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    if (!user) {
      setLocalError("Sign in to set a handle.");
      return;
    }

    setLocalError(null);
    setIsSavingUsername(true);

    try {
      const normalized = normalizeUsername(username);
      await saveUsername(normalized);

      const accessToken = await getAccessToken();
      await ensureSuiWallet();
      const suiAddress = getSuiAddressFromUser(user);
      if (accessToken && suiAddress) {
        const storedReferral = await getStoredReferralCode();
        try {
          await registerWithHedge(accessToken, {
            suiAddress,
            handle: normalized,
            referralCode: storedReferral ?? undefined,
          });
        } catch (registerErr) {
          if (!(registerErr instanceof HedgeRegisterError)) {
            console.warn("[onboarding] hedge register:", registerErr);
          }
        }
      }

      setStep("welcome");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your handle. Please try again.";
      setLocalError(message);
    } finally {
      setIsSavingUsername(false);
    }
  }, [ensureSuiWallet, getAccessToken, saveUsername, user, username]);

  const handleBack = useCallback(() => {
    setLocalError(null);
    if (step === "email") setStep("referral");
    else if (step === "otp") setStep("email");
    else if (step === "username" && !authenticated) setStep("otp");
  }, [authenticated, step]);

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

  const preview = normalizeUsername(username);

  if (step === "referral") {
    return (
      <OnboardingShell
        stepKey="referral"
        phase="referral"
        title="Enter Referral Code"
        subtitle="Let us know who referred you">
        <AuthPillInput
          value={referralCode}
          onChange={(value) => {
            setReferralCode(value);
            if (localError) setLocalError(null);
          }}
          placeholder="Referral code"
          onSubmit={() => void handleReferralContinue()}
        />
        {localError ? <p className="onboarding-shell__error">{localError}</p> : null}
        <p className="onboarding-shell__skip">
          Didn&apos;t get invited?{" "}
          <button type="button" onClick={() => void handleReferralContinue()}>
            Skip
          </button>
        </p>
      </OnboardingShell>
    );
  }

  if (step === "email") {
    return (
      <OnboardingShell
        stepKey="email"
        phase="email"
        title="Sign in with email"
        subtitle="Enter your email to continue"
        onBack={handleBack}>
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

  if (step === "otp") {
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
            setStep("username");
          }}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      stepKey="username"
      phase="username"
      title="Handle"
      subtitle="Choose a handle to join the waitlist"
      onBack={authenticated ? undefined : handleBack}>
      <AuthPillInput
        value={username}
        onChange={(value) => {
          setUsernameInput(value);
          if (localError) setLocalError(null);
        }}
        placeholder="Handle"
        prefix="@"
        maxLength={20}
        onSubmit={() => void handleUsernameContinue()}
        loading={isSavingUsername}
        disabled={isSavingUsername}
      />
      {preview ? (
        <p className="onboarding-shell__preview">
          You&apos;ll appear as <strong>@{preview}</strong>
        </p>
      ) : null}
      {localError ? <p className="onboarding-shell__error">{localError}</p> : null}
    </OnboardingShell>
  );
}
