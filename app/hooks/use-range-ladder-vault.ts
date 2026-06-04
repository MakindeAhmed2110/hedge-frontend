import { useCallback, useEffect, useState } from 'react';

import { usePredictPlayCards } from '~/hooks/use-predict-play-cards';
import { canRollRangeLadder, pickRollTargetCard } from '~/lib/predict/execute-predict';
import { planRangeLadder, selectVaultTargetCard } from '~/lib/predict/range-ladder';
import {
  getStoredRangeLadderDeployment,
  type StoredRangeLadderDeployment,
} from '~/lib/preferences/range-ladder-vault';
import type { PredictPlayCard } from '~/lib/predict/types';

export function useRangeLadderVault(owner: string | null | undefined) {
  const { cards, isLoading: isCardsLoading, error: cardsError, refetch: refetchCards } =
    usePredictPlayCards();
  const [deployment, setDeployment] = useState<StoredRangeLadderDeployment | null>(null);
  const [canRoll, setCanRoll] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  const refreshDeployment = useCallback(async () => {
    if (!owner) {
      setDeployment(null);
      setCanRoll(false);
      setIsLoadingLocal(false);
      return;
    }
    setIsLoadingLocal(true);
    try {
      const stored = await getStoredRangeLadderDeployment(owner);
      setDeployment(stored);
      setCanRoll(stored ? await canRollRangeLadder(stored) : false);
    } finally {
      setIsLoadingLocal(false);
    }
  }, [owner]);

  useEffect(() => {
    void refreshDeployment();
  }, [refreshDeployment]);

  const deployTarget: PredictPlayCard | null = selectVaultTargetCard(cards);
  const rollTarget: PredictPlayCard | null =
    deployment && cards.length > 0 ? pickRollTargetCard(cards, deployment) : deployTarget;

  const previewPlan =
    deployTarget != null
      ? planRangeLadder(deployTarget, deployment?.totalStakeUsd ?? 10)
      : null;

  return {
    deployment,
    canRoll,
    deployTarget,
    rollTarget,
    previewPlan,
    isLoading: isCardsLoading || isLoadingLocal,
    error: cardsError,
    refetch: async () => {
      await Promise.all([refetchCards(), refreshDeployment()]);
    },
    refreshDeployment,
  };
}
