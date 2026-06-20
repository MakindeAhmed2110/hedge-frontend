import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import { useAuthModal } from "~/components/auth/auth-modal-context";
import { AuthOtpInput } from "~/components/auth/auth-otp-input";
import { AuthPillInput } from "~/components/auth/auth-pill-input";
import { AuthStepDots } from "~/components/auth/auth-step-dots";
import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";

type Step = "email" | "otp";

export function HedgeAuthModal() {
  const { isOpen, closeAuth } = useAuthModal();
  const { ready, authenticated } = usePrivy();
  const { ensureSuiWallet } = useEnsureSuiWallet();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (err: unknown) => setError(String(err)),
  });

  useEffect(() => {
    if (!isOpen) return;
    setStep("email");
    setEmail("");
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (ready && authenticated && isOpen) {
      closeAuth();
    }
  }, [authenticated, closeAuth, isOpen, ready]);

  useEffect(() => {
    if (state.status === "awaiting-code-input") {
      setStep("otp");
      setError(null);
    }
    if (state.status === "error" && state.error) {
      setError(String(state.error));
    }
  }, [state]);

  const handleSendEmail = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setError(null);
    setEmail(trimmed);
    await sendCode({ email: trimmed });
    setStep("otp");
  }, [email, sendCode]);

  const handleOtp = useCallback(
    async (code: string) => {
      await loginWithCode({ code });
      await ensureSuiWallet();
      setError(null);
      closeAuth();
    },
    [closeAuth, ensureSuiWallet, loginWithCode]
  );

  const goBack = () => {
    setError(null);
    if (step === "otp") setStep("email");
  };

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !ready) return null;

  const titles: Record<Step, string> = {
    email: "Sign in",
    otp: "Verify",
  };

  const showBack = step === "otp" && !authenticated;

  return (
    <div
      className="auth-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && authenticated ? closeAuth() : undefined}>
      <div
        className="auth-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}>
        {showBack ? (
          <button type="button" className="auth-sheet__back" onClick={goBack} aria-label="Back">
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

        <div className="auth-sheet__brand">
          <img src="/assets/images/logo-icon-blue.png" alt="" width={40} height={40} />
        </div>

        <AuthStepDots active={step} />

        <h2 id="auth-modal-title" className="auth-sheet__title">
          {titles[step]}
        </h2>

        <div className="auth-sheet__body">
          {step === "email" ? (
            <AuthPillInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Email"
              onSubmit={() => void handleSendEmail()}
              loading={state.status === "sending-code"}
              disabled={state.status === "submitting-code"}
            />
          ) : null}

          {step === "otp" ? (
            <>
              <AuthOtpInput onComplete={handleOtp} disabled={state.status === "submitting-code"} />
              <button
                type="button"
                className="auth-sheet__link"
                onClick={() => void handleSendEmail()}
                disabled={state.status === "sending-code"}>
                Resend code
              </button>
            </>
          ) : null}

          {error ? <p className="auth-sheet__error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
