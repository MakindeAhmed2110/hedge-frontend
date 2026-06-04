import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createPredictManager,
  refreshPredictManagerCache,
  resolvePredictManagerId,
} from '~/lib/predict/execute-predict';
import { findManagerForOwner } from '~/lib/predict/predict-server';
import { setCelebratedPredictReady } from '~/lib/preferences/predict-manager';
import { hasTestnetSuiGas } from '~/lib/sui/gas-check';
import type { PredictManagerListItem } from '~/lib/predict/types';
import type { PrivySignRawHash } from '~/lib/sui/privy-sign';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

type UsePredictManagerArgs = {
  owner: string | null | undefined;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash?: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
};

export function usePredictManager({
  owner,
  publicKey,
  publicKeyFromPrivy,
  signRawHash,
  getAccessToken,
}: UsePredictManagerArgs) {
  const [managerId, setManagerId] = useState<string | null>(null);
  const [managerRecord, setManagerRecord] = useState<PredictManagerListItem | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [showReadyCelebration, setShowReadyCelebration] = useState(false);
  const backgroundCreateStartedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!owner) {
      setManagerId(null);
      setManagerRecord(null);
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    setError(null);
    try {
      const id = await resolvePredictManagerId(owner);
      setManagerId(id);
      const record = await findManagerForOwner(owner);
      setManagerRecord(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check Predict account');
      setManagerId(null);
      setManagerRecord(null);
    } finally {
      setIsChecking(false);
    }
  }, [owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    backgroundCreateStartedRef.current = false;
    setJustCreated(false);
    setShowReadyCelebration(false);
  }, [owner]);

  const createManager = useCallback(async (options?: { silent?: boolean }) => {
    if (!owner || !signRawHash) {
      throw new Error('Wallet not ready');
    }
    setIsCreating(true);
    setError(null);
    try {
      const id = await createPredictManager({
        senderAddress: owner,
        publicKey,
        publicKeyFromPrivy,
        signRawHash,
        getAccessToken,
      });
      setManagerId(id);
      const record = await findManagerForOwner(owner);
      setManagerRecord(record);
      if (!options?.silent) {
        setJustCreated(true);
        setShowReadyCelebration(true);
      }
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Predict account';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [owner, publicKey, publicKeyFromPrivy, signRawHash, getAccessToken]);

  useEffect(() => {
    if (
      !owner ||
      !signRawHash ||
      isChecking ||
      managerId ||
      isCreating ||
      backgroundCreateStartedRef.current
    ) {
      return;
    }

    backgroundCreateStartedRef.current = true;

    void (async () => {
      try {
        const hasGas = await hasTestnetSuiGas(owner);
        if (!hasGas) {
          return;
        }
        await createManager({ silent: true });
      } catch {
        // User sees the gas sheet when they try to bet without SUI.
      }
    })();
  }, [owner, signRawHash, isChecking, managerId, isCreating, createManager]);

  const ensureManager = useCallback(
    async (options?: { silent?: boolean }) => {
      if (managerId) {
        return managerId;
      }
      return createManager(options);
    },
    [managerId, createManager]
  );

  const dismissReadyCelebration = useCallback(async () => {
    setShowReadyCelebration(false);
    setJustCreated(false);
    if (owner) {
      await setCelebratedPredictReady(owner);
    }
  }, [owner]);

  const forceRefresh = useCallback(async () => {
    if (!owner) return null;
    const id = await refreshPredictManagerCache(owner);
    setManagerId(id);
    const record = await findManagerForOwner(owner);
    setManagerRecord(record);
    return id;
  }, [owner]);

  return {
    managerId,
    managerRecord,
    hasManager: Boolean(managerId),
    isChecking,
    isCreating,
    error,
    justCreated,
    showReadyCelebration,
    dismissReadyCelebration,
    refresh,
    forceRefresh,
    createManager,
    ensureManager,
  };
}
