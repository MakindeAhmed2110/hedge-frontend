import { useCallback, useEffect, useRef, useState } from "react";

import { OnboardingSuccessCheckmark } from "~/components/onboarding/onboarding-success-checkmark";

const OTP_LENGTH = 6;
const SUCCESS_HOLD_MS = 700;

type VerificationState = "idle" | "verifying" | "success";

type OnboardingOtpStepProps = {
  email: string;
  error: string | null;
  onResend: () => void;
  onVerify: (code: string) => Promise<void>;
  onVerified: () => void;
};

function OtpCell({
  digit,
  success,
}: {
  digit: string;
  success: boolean;
}) {
  return (
    <span
      className={
        success
          ? "onboarding-otp__cell onboarding-otp__cell--success"
          : digit
            ? "onboarding-otp__cell onboarding-otp__cell--filled"
            : "onboarding-otp__cell"
      }>
      {digit}
    </span>
  );
}

export function OnboardingOtpStep({
  email,
  error,
  onResend,
  onVerify,
  onVerified,
}: OnboardingOtpStepProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [verificationState, setVerificationState] = useState<VerificationState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = digits.join("");
  const isLocked = verificationState === "verifying" || verificationState === "success";
  const isSuccess = verificationState === "success";

  const focusInput = useCallback(() => {
    if (!isLocked) inputRef.current?.focus();
  }, [isLocked]);

  const resetDigits = useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(""));
    submittedRef.current = false;
    setVerificationState("idle");
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
    }
    focusInput();
  }, [focusInput]);

  const runVerification = useCallback(
    async (otpCode: string) => {
      setVerificationState("verifying");
      try {
        await onVerify(otpCode);
        setVerificationState("success");
        navigateTimeoutRef.current = setTimeout(() => {
          onVerified();
        }, SUCCESS_HOLD_MS);
      } catch {
        setVerificationState("idle");
        submittedRef.current = false;
        focusInput();
      }
    },
    [focusInput, onVerified, onVerify]
  );

  useEffect(() => {
    const t = setTimeout(() => focusInput(), 300);
    return () => clearTimeout(t);
  }, [focusInput]);

  useEffect(() => {
    if (code.length === OTP_LENGTH && !isLocked && !submittedRef.current) {
      submittedRef.current = true;
      void runVerification(code);
    }
  }, [code, isLocked, runVerification]);

  useEffect(() => {
    if (error) {
      setVerificationState("idle");
      submittedRef.current = false;
    }
  }, [error]);

  useEffect(
    () => () => {
      if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current);
    },
    []
  );

  const handleChange = (value: string) => {
    if (isLocked) return;
    const sanitized = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    sanitized.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    submittedRef.current = false;
  };

  return (
    <div className="onboarding-otp">
      <p className="onboarding-otp__hint">
        Code sent to <span>{email}</span>
      </p>

      <button type="button" className="onboarding-otp__tap" onClick={focusInput} disabled={isLocked}>
        <div className="onboarding-otp__row" aria-hidden>
          <div className="onboarding-otp__group">
            {digits.slice(0, 3).map((digit, index) => (
              <OtpCell key={index} digit={digit} success={isSuccess} />
            ))}
          </div>
          <span className="onboarding-otp__dash">–</span>
          <div className="onboarding-otp__group">
            {digits.slice(3, 6).map((digit, index) => (
              <OtpCell key={`b-${index}`} digit={digit} success={isSuccess} />
            ))}
          </div>
        </div>
        <input
          ref={inputRef}
          className="onboarding-otp__hidden"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isLocked}
          aria-label="Verification code"
        />
      </button>

      {verificationState === "verifying" ? (
        <span className="portfolio-assets__spinner" aria-hidden />
      ) : null}
      {isSuccess ? <OnboardingSuccessCheckmark /> : null}
      {error && !isSuccess ? <p className="onboarding-shell__error">{error}</p> : null}

      {isSuccess ? (
        <p className="onboarding-otp__verified">Verified — almost there…</p>
      ) : (
        <p className="onboarding-otp__resend">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={() => {
              resetDigits();
              onResend();
            }}
            disabled={isLocked}>
            Resend code
          </button>
        </p>
      )}
    </div>
  );
}
