import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE_ID,
  type LanguageId,
  isTranslatedLanguage,
} from "~/constants/languages";
import ar from "~/locales/ar.json";
import de from "~/locales/de.json";
import en from "~/locales/en.json";
import es from "~/locales/es.json";
import fr from "~/locales/fr.json";
import ja from "~/locales/ja.json";
import pt from "~/locales/pt.json";
import zh from "~/locales/zh.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  de: { translation: de },
  zh: { translation: zh },
  ja: { translation: ja },
  ar: { translation: ar },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE_ID,
  fallbackLng: DEFAULT_LANGUAGE_ID,
  supportedLngs: APP_LANGUAGES.map((lang) => lang.id),
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export async function applyAppLanguage(languageId: LanguageId): Promise<void> {
  const lng = isTranslatedLanguage(languageId) ? languageId : DEFAULT_LANGUAGE_ID;
  await i18n.changeLanguage(lng);
}

export default i18n;
