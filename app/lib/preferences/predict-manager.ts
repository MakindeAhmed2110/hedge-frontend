import * as SecureStore from '~/lib/storage/secure-store';

import { sanitizeSecureStoreKeyPart } from '~/lib/preferences/secure-store-key';

function storageKey(owner: string): string {
  return `hedge.predictManager.${sanitizeSecureStoreKeyPart(owner.toLowerCase())}`;
}

export async function getStoredPredictManagerId(owner: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(storageKey(owner));
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function setStoredPredictManagerId(
  owner: string,
  managerId: string
): Promise<void> {
  await SecureStore.setItemAsync(storageKey(owner), managerId);
}

export async function clearStoredPredictManagerId(owner: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(owner));
  } catch {
    // ignore
  }
}

function readyCelebrationKey(owner: string): string {
  return `hedge.predictManager.readyCelebrated.${sanitizeSecureStoreKeyPart(owner.toLowerCase())}`;
}

export async function hasCelebratedPredictReady(owner: string): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(readyCelebrationKey(owner));
    return value === '1';
  } catch {
    return false;
  }
}

export async function setCelebratedPredictReady(owner: string): Promise<void> {
  await SecureStore.setItemAsync(readyCelebrationKey(owner), '1');
}
