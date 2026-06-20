export type LanguageId = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'zh' | 'ja' | 'ar';

export type AppLanguage = {
  id: LanguageId;
  label: string;
  nativeName: string;
  flag: string;
  /** BCP-47 tag for future i18n */
  locale: string;
};

export const DEFAULT_LANGUAGE_ID: LanguageId = 'en';

/** Languages with a full locale file in locales/*.json */
export const TRANSLATED_LANGUAGE_IDS = [
  'en',
  'es',
  'fr',
  'pt',
  'de',
  'zh',
  'ja',
  'ar',
] as const satisfies readonly LanguageId[];

export type TranslatedLanguageId = (typeof TRANSLATED_LANGUAGE_IDS)[number];

export function isTranslatedLanguage(id: LanguageId): id is TranslatedLanguageId {
  return (TRANSLATED_LANGUAGE_IDS as readonly string[]).includes(id);
}

export const APP_LANGUAGES: AppLanguage[] = [
  { id: 'en', label: 'English', nativeName: 'English', flag: '🇺🇸', locale: 'en-US' },
  { id: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸', locale: 'es' },
  { id: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷', locale: 'fr' },
  { id: 'pt', label: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', locale: 'pt-BR' },
  { id: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪', locale: 'de' },
  { id: 'zh', label: 'Chinese', nativeName: '中文', flag: '🇨🇳', locale: 'zh-Hans' },
  { id: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵', locale: 'ja' },
  { id: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', locale: 'ar' },
];

const LANGUAGE_BY_ID = Object.fromEntries(APP_LANGUAGES.map((lang) => [lang.id, lang])) as Record<
  LanguageId,
  AppLanguage
>;

export function getLanguageById(id: LanguageId): AppLanguage {
  return LANGUAGE_BY_ID[id] ?? LANGUAGE_BY_ID[DEFAULT_LANGUAGE_ID];
}

export function isLanguageId(value: string): value is LanguageId {
  return value in LANGUAGE_BY_ID;
}
