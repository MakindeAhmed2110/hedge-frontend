import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LANGUAGE_ID,
  getLanguageById,
  isTranslatedLanguage,
  type AppLanguage,
  type LanguageId,
} from "~/constants/languages";
import { applyAppLanguage } from "~/lib/i18n";
import { getStoredLanguageId, setStoredLanguageId } from "~/lib/preferences/app-language";

export function useAppLanguage() {
  const [languageId, setLanguageId] = useState<LanguageId>(DEFAULT_LANGUAGE_ID);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = await getStoredLanguageId();
    await applyAppLanguage(id);
    setLanguageId(id);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setLanguage = useCallback(async (id: LanguageId) => {
    try {
      await setStoredLanguageId(id);
    } catch {
      // UI still switches; preference may not persist until next successful write.
    }
    await applyAppLanguage(id);
    setLanguageId(isTranslatedLanguage(id) ? id : DEFAULT_LANGUAGE_ID);
  }, []);

  const language: AppLanguage = getLanguageById(languageId);

  return {
    languageId,
    language,
    isLoading,
    setLanguage,
    refresh,
  };
}
