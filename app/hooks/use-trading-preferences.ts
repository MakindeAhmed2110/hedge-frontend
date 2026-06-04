import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_TRADING_PREFERENCES,
  type DefaultExpiryId,
  type DefaultStakeUsd,
  type TradingPreferencesState,
} from '~/constants/trading-preferences';
import {
  getStoredTradingPreferences,
  setStoredTradingPreferences,
} from '~/lib/preferences/trading-preferences';

export function useTradingPreferences() {
  const [preferences, setPreferences] = useState<TradingPreferencesState>(
    DEFAULT_TRADING_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = await getStoredTradingPreferences();
    setPreferences(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = useCallback(async (next: TradingPreferencesState) => {
    setPreferences(next);
    await setStoredTradingPreferences(next);
  }, []);

  const update = useCallback(async (patch: Partial<TradingPreferencesState>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      void setStoredTradingPreferences(next);
      return next;
    });
  }, []);

  const setDefaultStakeUsd = useCallback(
    (defaultStakeUsd: DefaultStakeUsd) => update({ defaultStakeUsd }),
    [update]
  );

  const setDefaultExpiryId = useCallback(
    (defaultExpiryId: DefaultExpiryId) => update({ defaultExpiryId }),
    [update]
  );

  const setSkipBetConfirmation = useCallback(
    (skipBetConfirmation: boolean) => update({ skipBetConfirmation }),
    [update]
  );

  const setHapticsOnSwipe = useCallback(
    (hapticsOnSwipe: boolean) => update({ hapticsOnSwipe }),
    [update]
  );

  const setShowOddsOnCard = useCallback(
    (showOddsOnCard: boolean) => update({ showOddsOnCard }),
    [update]
  );

  const setHidePnl = useCallback((hidePnl: boolean) => update({ hidePnl }), [update]);

  const setShowRiskWarnings = useCallback(
    (showRiskWarnings: boolean) => update({ showRiskWarnings }),
    [update]
  );

  const setNotifyOnSettlement = useCallback(
    (notifyOnSettlement: boolean) => update({ notifyOnSettlement }),
    [update]
  );

  return {
    preferences,
    isLoading,
    refresh,
    setDefaultStakeUsd,
    setDefaultExpiryId,
    setSkipBetConfirmation,
    setHapticsOnSwipe,
    setShowOddsOnCard,
    setHidePnl,
    setShowRiskWarnings,
    setNotifyOnSettlement,
  };
}
