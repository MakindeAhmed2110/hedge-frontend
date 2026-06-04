import * as SecureStore from '~/lib/storage/secure-store';

import {
  DEFAULT_LANGUAGE_ID,
  type LanguageId,
  isLanguageId,
  isTranslatedLanguage,
} from '~/constants/languages';

const STORAGE_KEY = 'hedge.app-language';
/** @deprecated Colon is invalid in SecureStore keys — read once for migration. */
const LEGACY_STORAGE_KEY = 'hedge:app-language';

export async function getStoredLanguageId(): Promise<LanguageId> {
  try {
    let value = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!value) {
      try {
        value = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
      } catch {
        // Legacy key was invalid on some platforms; ignore.
      }
      if (value && isLanguageId(value)) {
        await SecureStore.setItemAsync(STORAGE_KEY, value);
        try {
          await SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    }
    if (value && isLanguageId(value) && isTranslatedLanguage(value)) {
      return value;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_LANGUAGE_ID;
}

export async function setStoredLanguageId(id: LanguageId): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, id);
}
