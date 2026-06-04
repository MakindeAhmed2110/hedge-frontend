/**
 * Privy wallet import via REST API (server-side only — requires app secret).
 */
import { encryptPrivateKeyForPrivy } from '~/lib/privy/hpke-service';
import { parseSuiPrivateKeyInput } from '~/lib/sui/parse-private-key';

const PRIVY_AUTH_BASE = 'https://auth.privy.io/api/v1';
const SUI_CHAIN = 'sui';

export type PrivyImportedWallet = {
  id: string;
  address: string;
  chain_type: string;
};

export class PrivyWalletImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivyWalletImportError';
  }
}

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

async function listUserSuiWallets(
  appId: string,
  appSecret: string,
  userId: string
): Promise<PrivyImportedWallet[]> {
  const response = await fetch(`${PRIVY_AUTH_BASE}/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: privyHeaders(appId, appSecret),
  });

  if (!response.ok) return [];

  const userData = (await response.json()) as {
    linked_accounts?: Array<Record<string, unknown>>;
  };

  return (userData.linked_accounts ?? [])
    .filter(
      (account) =>
        account.type === 'wallet' &&
        (account.chain_type === SUI_CHAIN || account.chainType === SUI_CHAIN)
    )
    .map((account) => ({
      id: String(account.id ?? account.wallet_id ?? ''),
      address: String(account.address ?? ''),
      chain_type: SUI_CHAIN,
    }));
}

/**
 * Import an existing Sui wallet into Privy for the authenticated user.
 */
export async function importSuiWalletWithPrivy(
  appId: string,
  appSecret: string,
  userId: string,
  privateKeyInput: string,
  name?: string
): Promise<PrivyImportedWallet> {
  const { secretKeyHex, address: derivedAddress } = parseSuiPrivateKeyInput(privateKeyInput);
  const privateKeyHex = `0x${secretKeyHex}`;

  const initResponse = await fetch(`${PRIVY_AUTH_BASE}/wallets/import/init`, {
    method: 'POST',
    headers: privyHeaders(appId, appSecret),
    body: JSON.stringify({
      address: derivedAddress,
      chain_type: SUI_CHAIN,
      entropy_type: 'private-key',
      encryption_type: 'HPKE',
    }),
  });

  if (!initResponse.ok) {
    const errorBody = await initResponse.text();

    if (errorBody.toLowerCase().includes('wallet already exists')) {
      const wallets = await listUserSuiWallets(appId, appSecret, userId);
      const match = wallets.find(
        (w) => w.address.toLowerCase() === derivedAddress.toLowerCase()
      );
      if (match) return match;
      throw new PrivyWalletImportError(
        'This wallet is already linked to another account. Sign in with that account or use a different key.'
      );
    }

    throw new PrivyWalletImportError(
      errorBody || `Import could not be started (${initResponse.status}).`
    );
  }

  const initData = (await initResponse.json()) as { encryption_public_key?: string };
  const encryptionPublicKey = initData.encryption_public_key;

  if (!encryptionPublicKey) {
    throw new PrivyWalletImportError('Privy did not return an encryption key.');
  }

  const { ciphertext, encapsulated_key } = await encryptPrivateKeyForPrivy(
    encryptionPublicKey,
    privateKeyHex
  );

  const submitResponse = await fetch(`${PRIVY_AUTH_BASE}/wallets/import/submit`, {
    method: 'POST',
    headers: privyHeaders(appId, appSecret),
    body: JSON.stringify({
      wallet: {
        address: derivedAddress,
        chain_type: SUI_CHAIN,
        entropy_type: 'private-key',
        encryption_type: 'HPKE',
        ciphertext,
        encapsulated_key,
        ...(name ? { name } : {}),
      },
      owner: { user_id: userId },
    }),
  });

  if (!submitResponse.ok) {
    const errorBody = await submitResponse.text();
    throw new PrivyWalletImportError(
      errorBody || `Import failed (${submitResponse.status}).`
    );
  }

  const submitData = (await submitResponse.json()) as {
    id?: string;
    address?: string;
    chain_type?: string;
  };

  if (submitData.id && submitData.address) {
    return {
      id: submitData.id,
      address: submitData.address,
      chain_type: submitData.chain_type ?? SUI_CHAIN,
    };
  }

  const walletsAfter = await listUserSuiWallets(appId, appSecret, userId);
  const match = walletsAfter.find(
    (w) => w.address.toLowerCase() === derivedAddress.toLowerCase()
  );

  if (match) return match;

  return {
    id: '',
    address: derivedAddress,
    chain_type: SUI_CHAIN,
  };
}
