import * as SecureStore from '~/lib/storage/secure-store';

import type { PlannedRangeLadder } from '~/lib/predict/range-ladder';
import { sanitizeSecureStoreKeyPart } from '~/lib/preferences/secure-store-key';

export type StoredRangeLadderBand = {
  lowerStrike: string;
  higherStrike: string;
  quantity: string;
  stakeUsd: number;
};

export type StoredRangeLadderDeployment = {
  oracleId: string;
  expiry: number;
  underlyingAsset: string;
  atmStrike: string;
  totalStakeUsd: number;
  bands: StoredRangeLadderBand[];
  deployedAt: number;
};

function storageKey(owner: string): string {
  return `hedge.rangeLadder.${sanitizeSecureStoreKeyPart(owner.toLowerCase())}`;
}

export async function getStoredRangeLadderDeployment(
  owner: string
): Promise<StoredRangeLadderDeployment | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(owner));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredRangeLadderDeployment;
  } catch {
    return null;
  }
}

export async function setStoredRangeLadderDeployment(
  owner: string,
  deployment: StoredRangeLadderDeployment
): Promise<void> {
  await SecureStore.setItemAsync(storageKey(owner), JSON.stringify(deployment));
}

export async function clearStoredRangeLadderDeployment(owner: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(owner));
  } catch {
    // ignore
  }
}

export function deploymentFromPlan(plan: PlannedRangeLadder): StoredRangeLadderDeployment {
  return {
    oracleId: plan.card.oracle.oracle_id,
    expiry: plan.card.oracle.expiry,
    underlyingAsset: plan.card.oracle.underlying_asset,
    atmStrike: plan.card.atmStrike.toString(),
    totalStakeUsd: plan.totalStakeUsd,
    bands: plan.bands.map((band) => ({
      lowerStrike: band.lowerStrike.toString(),
      higherStrike: band.higherStrike.toString(),
      quantity: band.quantity.toString(),
      stakeUsd: band.stakeUsd,
    })),
    deployedAt: Date.now(),
  };
}
