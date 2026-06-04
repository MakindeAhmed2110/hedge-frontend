import { useTranslation } from "react-i18next";

import { GetStartedButton } from "~/components/onboarding/get-started-button";

type SignInRequiredProps = {
  title?: string;
  message?: string;
};

export function SignInRequired({ title, message }: SignInRequiredProps) {
  const { t } = useTranslation();

  return (
    <div className="sign-in-required">
      <p className="sign-in-required__title">{title ?? t("auth.signInRequired")}</p>
      {message ? <p className="sign-in-required__message">{message}</p> : null}
      <GetStartedButton variant="pill" />
    </div>
  );
}
