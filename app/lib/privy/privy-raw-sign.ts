/**
 * Privy wallet raw_sign (server-side, requires app secret).
 * @see https://docs.privy.io/recipes/use-tier-2
 * @see https://docs.sui.io/develop/transactions/transaction-auth/intent-signing
 */

const PRIVY_API_BASE = 'https://api.privy.io/v1';

export type PrivyRawSignResult = {
  signature: `0x${string}`;
  encoding: string;
};

function basicAuthHeader(appId: string, appSecret: string): string {
  return `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`;
}

function privyHeaders(appId: string, appSecret: string): HeadersInit {
  return {
    Authorization: basicAuthHeader(appId, appSecret),
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

/**
 * Sign Sui transaction intent bytes with Privy (blake2b256 then Ed25519).
 * `intentMessageHex` is hex of `messageWithIntent('TransactionData', txBytes)`.
 */
export async function rawSignSuiIntentMessage(
  appId: string,
  appSecret: string,
  walletId: string,
  intentMessageHex: string
): Promise<PrivyRawSignResult> {
  const response = await fetch(
    `${PRIVY_API_BASE}/wallets/${encodeURIComponent(walletId)}/raw_sign`,
    {
      method: 'POST',
      headers: privyHeaders(appId, appSecret),
      body: JSON.stringify({
        params: {
          bytes: intentMessageHex,
          encoding: 'hex',
          hash_function: 'blake2b256',
        },
      }),
    }
  );

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : text || `Privy raw_sign failed (${response.status})`;
    throw new Error(message);
  }

  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: { signature?: string; encoding?: string } }).data
      : (payload as { signature?: string; encoding?: string });

  const signature = data?.signature;
  if (!signature || typeof signature !== 'string') {
    throw new Error('Privy raw_sign returned no signature');
  }

  const normalized = signature.startsWith('0x') ? signature : `0x${signature}`;

  return {
    signature: normalized as `0x${string}`,
    encoding: data.encoding ?? 'hex',
  };
}
