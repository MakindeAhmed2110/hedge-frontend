import * as SecureStore from '~/lib/storage/secure-store';

import type { PredictPositionSummary } from '~/lib/predict/types';
import { positionAlertKey } from '~/lib/predict/position-lifecycle';

const STORAGE_KEY = 'hedge.trade-alert-seen-keys';

export function lossAlertKey(position: PredictPositionSummary): string {
  return `${positionAlertKey(position)}-loss`;
}

async function readKeys(): Promise<Set<string>> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function writeKeys(keys: Set<string>): Promise<void> {
  const trimmed = [...keys].slice(-200);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function hasSeenTradeAlert(key: string): Promise<boolean> {
  const keys = await readKeys();
  return keys.has(key);
}

export async function markTradeAlertSeen(key: string): Promise<void> {
  const keys = await readKeys();
  keys.add(key);
  await writeKeys(keys);
}
