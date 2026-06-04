import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useRef, useState } from "react";

import {
  applyHedgeReferralCode,
  fetchHedgeMe,
  fetchHedgeReferrals,
} from '~/lib/hedge/fetch-hedge-data';
import { HedgeApiError } from '~/lib/hedge/hedge-bff-fetch';
import type { HedgeReferralsResponse, HedgeUserProfile } from '~/lib/hedge/types';

export function useHedgeReferrals() {
  const { getAccessToken } = usePrivy();
  const [profile, setProfile] = useState<HedgeUserProfile | null>(null);
  const [referrals, setReferrals] = useState<HedgeReferralsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsRegister, setNeedsRegister] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setNeedsRegister(false);

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Sign in to view referrals.');
        }

        let me: HedgeUserProfile;
        try {
          me = await fetchHedgeMe(token);
        } catch (err) {
          if (err instanceof HedgeApiError && err.status === 404) {
            setProfile(null);
            setReferrals({ totalReferrals: 0, referrals: [] });
            setNeedsRegister(true);
            setError(null);
            return;
          }
          throw err;
        }

        let list: HedgeReferralsResponse = { totalReferrals: 0, referrals: [] };
        try {
          list = await fetchHedgeReferrals(token);
        } catch (err) {
          if (!(err instanceof HedgeApiError && err.status === 404)) {
            throw err;
          }
        }

        if (!mountedRef.current) return;
        setProfile(me);
        setReferrals(list);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load referrals');
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [getAccessToken]
  );

  const refetch = useCallback(() => {
    setIsRefreshing(true);
    void load(true);
  }, [load]);

  const applyReferral = useCallback(
    async (referralCode: string) => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sign in to apply a referral code.');
      }
      setIsApplying(true);
      try {
        const me = await applyHedgeReferralCode(token, referralCode);
        if (!mountedRef.current) return me;
        setProfile(me);
        setNeedsRegister(false);
        await load(true);
        return me;
      } finally {
        if (mountedRef.current) setIsApplying(false);
      }
    },
    [getAccessToken, load]
  );

  useEffect(() => {
    mountedRef.current = true;
    void load(false);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return {
    profile,
    referrals,
    isLoading,
    isRefreshing,
    error,
    needsRegister,
    refetch,
    applyReferral,
    isApplying,
  };
}
