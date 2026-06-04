import * as SecureStore from '~/lib/storage/secure-store';

import { normalizeUsername } from '~/lib/privy/custom-metadata';
import { sanitizeSecureStoreKeyPart } from '~/lib/preferences/secure-store-key';

function storageKey(userId: string): string {
  return `hedge.username.${sanitizeSecureStoreKeyPart(userId)}`;
}

export async function getStoredUsername(userId: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(storageKey(userId));
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function setStoredUsername(userId: string, username: string): Promise<void> {
  await SecureStore.setItemAsync(storageKey(userId), normalizeUsername(username));
}

export async function clearStoredUsername(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId));
  } catch {
    // ignore
  }
}
