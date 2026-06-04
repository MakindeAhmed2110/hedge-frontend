/**
 * Privy credentials for `app/api/*` routes only — never import from client screens.
 */

export function getPrivyApiCredentials(): { appId: string; appSecret: string } {
  const appId =
    process.env.PRIVY_APP_ID ??
    process.env.EXPO_PUBLIC_PRIVY_APP_ID ??
    '';
  const appSecret = process.env.PRIVY_APP_SECRET ?? '';

  if (!appId || !appSecret) {
    throw new Error(
      'Missing PRIVY_APP_ID or PRIVY_APP_SECRET in .env (do not use EXPO_PUBLIC_ for the secret).'
    );
  }

  return { appId, appSecret };
}
