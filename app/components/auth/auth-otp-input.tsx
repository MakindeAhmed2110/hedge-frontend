import { useCallback, useEffect, useRef, useState } from "react";

const LENGTH = 6;

type AuthOtpInputProps = {
  onComplete: (code: string) => Promise<void>;
  disabled?: boolean;
};

export function AuthOtpInput({ onComplete, disabled }: AuthOtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  const code = digits.join("");

  const reset = useCallback(() => {
    setDigits(Array(LENGTH).fill(""));
    submittedRef.current = false;
    setBusy(false);
  }, []);

  const submit = useCallback(
    async (value: string) => {
      if (submittedRef.current || disabled || busy) return;
      if (value.length !== LENGTH) return;
      submittedRef.current = true;
      setBusy(true);
      try {
        await onComplete(value);
      } catch {
        reset();
      } finally {
        setBusy(false);
      }
    },
    [busy, disabled, onComplete, reset]
  );

  useEffect(() => {
    void submit(code);
  }, [code, submit]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (raw: string) => {
    if (disabled || busy) return;
    const next = raw.replace(/\D/g, "").slice(0, LENGTH).split("");
    while (next.length < LENGTH) next.push("");
    setDigits(next);
  };

  return (
    <button
      type="button"
      className="auth-otp"
      onClick={() => inputRef.current?.focus()}
      disabled={disabled || busy}>
      <input
        ref={inputRef}
        className="auth-otp__hidden"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || busy}
        aria-label="Verification code"
      />
      <div className="auth-otp__cells">
        {digits.map((d, i) => (
          <span key={i} className={`auth-otp__cell ${d ? "auth-otp__cell--filled" : ""}`}>
            {d}
          </span>
        ))}
      </div>
    </button>
  );
}
