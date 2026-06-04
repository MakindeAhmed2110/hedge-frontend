import { useEffect, useState } from 'react';

import { COINGECKO_SUI_USD_URL } from '~/lib/portfolio/usd-value';

type CoinGeckoSuiPriceResponse = {
  sui?: { usd?: number };
};

export function useSuiUsdPrice() {
  const [suiUsdPrice, setSuiUsdPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(COINGECKO_SUI_USD_URL);
        if (!response.ok) {
          throw new Error(`CoinGecko ${response.status}`);
        }
        const data = (await response.json()) as CoinGeckoSuiPriceResponse;
        const price = data.sui?.usd;
        if (!cancelled && typeof price === 'number' && price > 0) {
          setSuiUsdPrice(price);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load SUI price');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    suiUsdPrice,
    isLoading: suiUsdPrice === null && error === null,
    error,
  };
}
