/**
 * Privy REST API — used from Expo API routes only (requires app secret).
 * @see https://docs.privy.io/user-management/users/custom-metadata#rest-api
 */

const PRIVY_AUTH_BASE = 'https://auth.privy.io/api/v1';

export type PrivyRestUser = {
  id: string;
  custom_metadata?: Record<string, string | number | boolean>;
  [key: string]: unknown;
};

function basicAuthHeader(appId: string, appSecret: string): string {
  const credentials = `${appId}:${appSecret}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

function privyHeaders(appId: string, appSecret: string): HeadersInit {
  return {
    Authorization: basicAuthHeader(appId, appSecret),
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

async function parsePrivyResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

/**
 * PATCH — partial update (shallow merge). Preserves keys not in the body.
 */
export async function patchUserCustomMetadata(
  appId: string,
  appSecret: string,
  userDid: string,
  customMetadata: Record<string, string | number | boolean>
): Promise<PrivyRestUser> {
  const response = await fetch(
    `${PRIVY_AUTH_BASE}/users/${encodeURIComponent(userDid)}/custom_metadata`,
    {
      method: 'PATCH',
      headers: privyHeaders(appId, appSecret),
      body: JSON.stringify({ custom_metadata: customMetadata }),
    }
  );

  const payload = await parsePrivyResponse(response);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Privy API error (${response.status})`;
    throw new Error(message);
  }

  return payload as PrivyRestUser;
}

/**
 * POST — replaces the entire custom_metadata object.
 */
export async function replaceUserCustomMetadata(
  appId: string,
  appSecret: string,
  userDid: string,
  customMetadata: Record<string, string | number | boolean>
): Promise<PrivyRestUser> {
  const response = await fetch(
    `${PRIVY_AUTH_BASE}/users/${encodeURIComponent(userDid)}/custom_metadata`,
    {
      method: 'POST',
      headers: privyHeaders(appId, appSecret),
      body: JSON.stringify({ custom_metadata: customMetadata }),
    }
  );

  const payload = await parsePrivyResponse(response);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Privy API error (${response.status})`;
    throw new Error(message);
  }

  return payload as PrivyRestUser;
}
