import type { User } from "@privy-io/react-auth";

import { USERNAME_METADATA_KEY, validateUsername } from '~/lib/privy/custom-metadata';

type SyncMetadataResponse = {
  user: User;
};

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error')
  );
}

/**
 * PATCH Privy custom_metadata via Expo Router API route → Privy REST API.
 * @see https://docs.privy.io/user-management/users/custom-metadata#rest-api
 */
export async function syncUsernameToPrivy(
  accessToken: string,
  username: string
): Promise<User> {
  const validationError = validateUsername(username);
  if (validationError) {
    throw new Error(validationError);
  }

  let response: Response;
  try {
    response = await fetch('/api/users/custom-metadata', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        custom_metadata: { [USERNAME_METADATA_KEY]: username },
      }),
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(
        'Could not reach the API route. Restart Metro with `pnpm start`.'
      );
    }
    throw error;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : 'Could not save handle to Privy.';
    throw new Error(message);
  }

  const data = payload as SyncMetadataResponse;
  if (!data?.user) {
    throw new Error('Unexpected response from server.');
  }

  return data.user;
}
