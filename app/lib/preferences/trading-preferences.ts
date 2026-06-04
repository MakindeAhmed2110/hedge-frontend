import * as SecureStore from '~/lib/storage/secure-store';

import {
  DEFAULT_TRADING_PREFERENCES,
  isDefaultExpiryId,
  isDefaultStakeUsd,
  type TradingPreferencesState,
} from '~/constants/trading-preferences';

const STORAGE_KEY = 'hedge.trading-preferences';
/** @deprecated Colon is invalid in SecureStore keys — read once for migration. */
const LEGACY_STORAGE_KEY = 'hedge:trading-preferences';

function mergeStoredPreferences(
  parsed: Partial<TradingPreferencesState>
): TradingPreferencesState {
  return {
    ...DEFAULT_TRADING_PREFERENCES,
    ...parsed,
    defaultStakeUsd: isDefaultStakeUsd(Number(parsed.defaultStakeUsd))
      ? parsed.defaultStakeUsd!
      : DEFAULT_TRADING_PREFERENCES.defaultStakeUsd,
    defaultExpiryId:
      parsed.defaultExpiryId && isDefaultExpiryId(parsed.defaultExpiryId)
        ? parsed.defaultExpiryId
        : DEFAULT_TRADING_PREFERENCES.defaultExpiryId,
  };
}

export async function getStoredTradingPreferences(): Promise<TradingPreferencesState> {
  try {
    let raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) {
      try {
        raw = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
      } catch {
        // Legacy key was invalid on some platforms; ignore.
      }
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TradingPreferencesState>;
        const merged = mergeStoredPreferences(parsed);
        await setStoredTradingPreferences(merged);
        try {
          await SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
        return merged;
      }
      return DEFAULT_TRADING_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<TradingPreferencesState>;
    return mergeStoredPreferences(parsed);
  } catch {
    return DEFAULT_TRADING_PREFERENCES;
  }
}

export async function setStoredTradingPreferences(
  state: TradingPreferencesState
): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}
