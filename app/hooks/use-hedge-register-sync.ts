import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';

import { useAppUsername } from '~/hooks/use-app-username';
import { HedgeRegisterError, registerWithHedge } from '~/lib/hedge/register-with-hedge';
import { getStoredReferralCode } from '~/lib/preferences/referral';
import { getSuiAddressFromUser } from '~/lib/privy/user-accounts';

/**
 * Idempotent sync: registers the Privy user with Hedge API when handle + wallet exist.
 * Failures are logged; onboarding also calls register explicitly on first signup.
 */
export function useHedgeRegisterSync(): void {
  const { user, ready, getAccessToken } = usePrivy();
  const { username, hasUsername } = useAppUsername();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !user || !hasUsername || !username) return;

    const suiAddress = getSuiAddressFromUser(user);
    if (!suiAddress) return;

    const syncKey = `${user.id}:${username}:${suiAddress}`;
    if (lastKeyRef.current === syncKey) return;

    let cancelled = false;

    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;

        const referralCode = await getStoredReferralCode();
        await registerWithHedge(token, {
          suiAddress,
          handle: username,
          referralCode: referralCode ?? undefined,
        });

        if (!cancelled) {
          lastKeyRef.current = syncKey;
        }
      } catch (error) {
        if (error instanceof HedgeRegisterError) {
          console.warn('[hedge-register]', error.message);
        } else {
          console.warn('[hedge-register]', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken, hasUsername, ready, user, username]);
}
