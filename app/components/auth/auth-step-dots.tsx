type AuthStep = "email" | "otp" | "handle";

const STEPS: AuthStep[] = ["email", "otp", "handle"];

type AuthStepDotsProps = {
  active: AuthStep;
};

export function AuthStepDots({ active }: AuthStepDotsProps) {
  const activeIndex = STEPS.indexOf(active);

  return (
    <div className="auth-step-dots" aria-hidden>
      {STEPS.map((step, index) => (
        <span
          key={step}
          className={`auth-step-dot ${index === activeIndex ? "auth-step-dot--active" : ""}`}
        />
      ))}
    </div>
  );
}
