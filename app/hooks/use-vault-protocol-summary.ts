import { useCallback, useEffect, useState } from 'react';

import { fetchVaultSummary } from '~/lib/predict/predict-server';
import type { PredictVaultSummary } from '~/lib/predict/types';

export function useVaultProtocolSummary() {
  const [summary, setSummary] = useState<PredictVaultSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVaultSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, isLoading, error, refetch: load };
}
