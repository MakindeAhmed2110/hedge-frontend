import { useEffect, useRef } from 'react';

import { isExpiredPendingClear } from '~/lib/predict/position-lifecycle';
import {
  PredictTradeError,
  redeemDirectionalPosition,
} from '~/lib/predict/execute-predict';
import {
  positionOpenQuantityRaw,
  positionStrikeRaw,
} from '~/lib/predict/position-redeem';
import type { PredictPositionSummary } from '~/lib/predict/types';
import type { PrivySignRawHash } from '~/lib/sui/privy-sign';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

type SignContext = {
  senderAddress: string;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
};

type UseAutoClearExpiredPositionsArgs = {
  positions: PredictPositionSummary[];
  signContext: SignContext | null;
  enabled: boolean;
  onCleared: (position: PredictPositionSummary) => void;
};

export function useAutoClearExpiredPositions({
  positions,
  signContext,
  enabled,
  onCleared,
}: UseAutoClearExpiredPositionsArgs) {
  const attemptedRef = useRef<Set<string>>(new Set());
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled || !signContext) {
      return;
    }

    const pending = positions.filter(
      (position) =>
        isExpiredPendingClear(position) &&
        !attemptedRef.current.has(
          `${position.oracle_id}-${position.strike}-${position.is_up}`
        )
    );

    if (pending.length === 0 || runningRef.current) {
      return;
    }

    runningRef.current = true;
    void (async () => {
      try {
        for (const position of pending) {
          const key = `${position.oracle_id}-${position.strike}-${position.is_up}`;
          attemptedRef.current.add(key);

          try {
            await redeemDirectionalPosition(
              {
                senderAddress: signContext.senderAddress,
                oracleId: position.oracle_id,
                expiry: position.expiry,
                strike: positionStrikeRaw(position),
                isUp: position.is_up,
                quantity: positionOpenQuantityRaw(position),
              },
              signContext
            );
            onCleared(position);
          } catch (err) {
            if (err instanceof PredictTradeError && err.code === 'NO_SUI_GAS') {
              break;
            }
          }
        }
      } finally {
        runningRef.current = false;
      }
    })();
  }, [positions, signContext, enabled, onCleared]);
}
