import { useTranslation } from "react-i18next";

type TabPlaceholderProps = {
  titleKey: string;
  hintKey?: string;
};

export function TabPlaceholder({ titleKey, hintKey }: TabPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-8 lg:px-8 max-w-lg mx-auto text-center">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      {hintKey ? <p className="text-hedge-muted mt-2">{t(hintKey)}</p> : null}
      <p className="text-sm text-hedge-muted mt-6">
        Full trading flows match the mobile app — open Hedge on iOS/Android to sign transactions.
      </p>
    </div>
  );
}

export default TabPlaceholder;
