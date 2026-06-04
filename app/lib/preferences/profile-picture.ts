import * as SecureStore from '~/lib/storage/secure-store';

import { sanitizeSecureStoreKeyPart } from '~/lib/preferences/secure-store-key';

function storageKey(userId: string): string {
  return `hedge.profilePicture.${sanitizeSecureStoreKeyPart(userId)}`;
}

export async function getStoredProfilePictureUri(userId: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(storageKey(userId));
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function setStoredProfilePictureUri(userId: string, uri: string): Promise<void> {
  await SecureStore.setItemAsync(storageKey(userId), uri);
}

export async function clearStoredProfilePictureUri(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId));
  } catch {
    // ignore
  }
}
