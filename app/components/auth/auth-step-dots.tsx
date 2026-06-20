type AuthStep = "email" | "otp";

const STEPS: AuthStep[] = ["email", "otp"];

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
