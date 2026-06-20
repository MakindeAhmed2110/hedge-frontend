import { useTranslation } from "react-i18next";

import { APP_LANGUAGES, type LanguageId } from "~/constants/languages";

type LanguagePickerPanelProps = {
  languageId: LanguageId;
  pendingLanguageId: LanguageId | null;
  onSelect: (id: LanguageId) => void;
};

export function LanguagePickerPanel({
  languageId,
  pendingLanguageId,
  onSelect,
}: LanguagePickerPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="hedge-language-picker" role="listbox" aria-label={t("language.title")}>
      {APP_LANGUAGES.map((lang) => {
        const selected = lang.id === languageId;
        const saving = pendingLanguageId === lang.id;

        return (
          <button
            key={lang.id}
            type="button"
            role="option"
            aria-selected={selected}
            className="hedge-language-picker__option"
            onClick={() => onSelect(lang.id)}
            disabled={Boolean(pendingLanguageId)}>
            <span className="hedge-language-picker__flag" aria-hidden>
              {lang.flag}
            </span>
            <span className="hedge-language-picker__label">{lang.nativeName}</span>
            {saving ? (
              <span className="portfolio-assets__spinner hedge-language-picker__spinner" aria-hidden />
            ) : selected ? (
              <span className="hedge-language-picker__dot" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
