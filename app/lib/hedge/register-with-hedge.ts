export type HedgeRegisterBody = {
  suiAddress: string;
  handle: string;
  referralCode?: string;
};

export type HedgeRegisterResult = {
  userAddress: string;
  handle: string;
  referralCode: string | null;
  referralUrl: string | null;
  hasReferrer: boolean;
};

export class HedgeRegisterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HedgeRegisterError';
  }
}

import { appApiUrl } from '~/lib/hedge/api-base-url';

/** Calls Expo BFF `POST /api/hedge/register` (Privy JWT → Hedge API + service key). */
export async function registerWithHedge(
  accessToken: string,
  body: HedgeRegisterBody
): Promise<HedgeRegisterResult> {
  const response = await fetch(appApiUrl('/api/hedge/register'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: HedgeRegisterResult;
    error?: string | { message?: string };
  };

  if (!response.ok) {
    const err =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message ?? `Registration failed (${response.status})`;
    throw new HedgeRegisterError(err);
  }

  if (!payload.data) {
    throw new HedgeRegisterError('Invalid registration response');
  }

  return payload.data;
}
