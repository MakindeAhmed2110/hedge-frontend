import { usePrivy } from '@privy-io/react-auth';

import { useAppUsername } from '~/hooks/use-app-username';
import { getEmailFromUser, getSuiAddressFromUser, getSuiWalletFromUser } from '~/lib/privy/user-accounts';

/** Privy user + derived Sui embedded-wallet fields for the account screen. */
export function useSuiAccount() {
  const { user, ready, logout, getAccessToken } = usePrivy();
  const { username, isLoading: isUsernameLoading } = useAppUsername();

  return {
    user,
    isReady: ready,
    logout,
    getAccessToken,
    email: getEmailFromUser(user),
    username,
    isUsernameLoading,
    suiAddress: getSuiAddressFromUser(user),
    suiWallet: getSuiWalletFromUser(user),
    hasSuiWallet: Boolean(getSuiAddressFromUser(user)),
  };
}
