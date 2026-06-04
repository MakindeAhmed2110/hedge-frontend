import type { PrivyImportedWallet } from '~/lib/privy/privy-wallet-import';

type ImportWalletResponse = {
  wallet: PrivyImportedWallet;
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
 * Import a Sui wallet via Expo API route → Privy REST import (HPKE).
 */
export async function importSuiWallet(
  accessToken: string,
  privateKey: string,
  name?: string
): Promise<PrivyImportedWallet> {
  let response: Response;
  try {
    response = await fetch('/api/wallets/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        private_key: privateKey,
        ...(name ? { name } : {}),
      }),
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Could not reach the server. Restart Metro with `pnpm start`.');
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
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : 'Could not import wallet.';
    throw new Error(message);
  }

  const data = payload as ImportWalletResponse;
  if (!data?.wallet?.address) {
    throw new Error('Unexpected response from server.');
  }

  return data.wallet;
}
