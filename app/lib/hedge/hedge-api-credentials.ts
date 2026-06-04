/**
 * Hedge API credentials for `app/api/*` routes only — never import from client screens.
 */

export function getHedgeApiCredentials(): { hedgeApiUrl: string; serviceKey: string } {
  const hedgeApiUrl = (
    process.env.HEDGE_API_URL ??
    process.env.VITE_HEDGE_API_BASE_URL ??
    'https://api.hedgeapp.trade'
  )
    .trim()
    .replace(/\/$/, '');

  const serviceKey = process.env.HEDGE_SERVICE_KEY?.trim() ?? '';

  if (!hedgeApiUrl) {
    throw new Error('Missing HEDGE_API_URL in .env');
  }
  if (!serviceKey) {
    throw new Error(
      'Missing HEDGE_SERVICE_KEY in .env (server-only; do not use EXPO_PUBLIC_).'
    );
  }

  return { hedgeApiUrl, serviceKey };
}
