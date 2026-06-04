import type { User } from "@privy-io/react-auth";

type LinkedAccountLike = {
  type?: string;
  chain_type?: string;
  chainType?: string;
  address?: string;
  id?: string;
  wallet_id?: string;
  wallet_client_type?: string;
  walletClientType?: string;
  wallet_type?: string;
  walletType?: string;
};

export type SuiWalletAccount = {
  id: string;
  address: string;
  walletType: 'embedded' | 'imported' | 'unknown';
};

function getLinkedAccounts(user: User): LinkedAccountLike[] {
  const raw = user as User & {
    linked_accounts?: LinkedAccountLike[];
    linkedAccounts?: LinkedAccountLike[];
  };
  return raw.linked_accounts ?? raw.linkedAccounts ?? [];
}

export function getEmailFromUser(user: User | null): string | null {
  if (!user) return null;

  const direct = (user as User & { email?: { address?: string } }).email?.address;
  if (direct) return direct;

  const emailAccount = getLinkedAccounts(user).find((account) => account.type === 'email');
  return emailAccount?.address ?? null;
}

function isSuiWalletAccount(account: LinkedAccountLike): boolean {
  return (
    account.type === 'wallet' &&
    (account.chain_type === 'sui' || account.chainType === 'sui')
  );
}

function resolveWalletType(account: LinkedAccountLike): SuiWalletAccount['walletType'] {
  const clientType = account.wallet_client_type ?? account.walletClientType;
  const walletType = account.wallet_type ?? account.walletType;

  if (clientType === 'privy' || walletType === 'privy') return 'embedded';
  if (walletType === 'imported' || clientType === 'imported') return 'imported';
  return 'unknown';
}

export function getSuiWalletsFromUser(user: User | null): SuiWalletAccount[] {
  if (!user) return [];

  return getLinkedAccounts(user)
    .filter(isSuiWalletAccount)
    .map((account) => ({
      id: String(account.id ?? account.wallet_id ?? account.address ?? ''),
      address: account.address ?? '',
      walletType: resolveWalletType(account),
    }))
    .filter((w) => Boolean(w.address));
}

export function getSuiWalletFromUser(user: User | null): LinkedAccountLike | null {
  if (!user) return null;

  return getLinkedAccounts(user).find(isSuiWalletAccount) ?? null;
}

export function getSuiAddressFromUser(user: User | null): string | null {
  return getSuiWalletFromUser(user)?.address ?? null;
}

export function getSuiPublicKeyFromUser(user: User | null): string | null {
  const wallet = getSuiWalletFromUser(user);
  if (!wallet) return null;

  const withKey = wallet as LinkedAccountLike & {
    public_key?: string;
    publicKey?: string;
  };

  return withKey.public_key ?? withKey.publicKey ?? null;
}
