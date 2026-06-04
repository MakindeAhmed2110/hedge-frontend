import { createRemoteJWKSet, jwtVerify } from 'jose';

const PRIVY_AUTH_API = 'https://auth.privy.io/api';
const JWT_ALGORITHM = 'ES256';
const JWT_ISSUER = 'privy.io';

export type VerifiedPrivyAccessToken = {
  user_id: string;
  session_id: string;
  app_id: string;
};

const jwksByAppId = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getPrivyJwks(appId: string) {
  let jwks = jwksByAppId.get(appId);
  if (!jwks) {
    const url = new URL(`${PRIVY_AUTH_API}/v1/apps/${appId}/jwks.json`);
    jwks = createRemoteJWKSet(url, { cacheMaxAge: 60 * 60 * 1000 });
    jwksByAppId.set(appId, jwks);
  }
  return jwks;
}

/**
 * Verify a Privy access token (same rules as @privy-io/node) without HPKE deps.
 */
export async function verifyPrivyAccessToken(
  accessToken: string,
  appId: string
): Promise<VerifiedPrivyAccessToken> {
  const jwks = getPrivyJwks(appId);

  const { payload } = await jwtVerify(accessToken, jwks, {
    typ: 'JWT',
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: appId,
  });

  const userId = payload.sub;
  const sessionId = payload.sid;

  if (typeof userId !== 'string' || typeof sessionId !== 'string') {
    throw new Error('Invalid access token payload.');
  }

  return {
    user_id: userId,
    session_id: sessionId,
    app_id: typeof payload.aud === 'string' ? payload.aud : appId,
  };
}
