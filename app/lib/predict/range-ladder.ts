import {
  RANGE_LADDER_BAND_STEPS,
  RANGE_LADDER_PREFERRED_ASSET,
} from '~/constants/vault';
import { strikeBandAroundAtm } from '~/lib/predict/strike';
import { stakeUsdToDepositRaw, stakeUsdToQuantity } from '~/lib/predict/transactions';
import type { PredictPlayCard } from '~/lib/predict/types';
import type { RangeLadderBandMint } from '~/lib/predict/transactions';

export type PlannedRangeLadderBand = {
  lowerStrike: bigint;
  higherStrike: bigint;
  label: string;
  stakeUsd: number;
  quantity: bigint;
};

export type PlannedRangeLadder = {
  card: PredictPlayCard;
  bands: PlannedRangeLadderBand[];
  totalStakeUsd: number;
  totalDepositRaw: bigint;
};

export function selectVaultTargetCard(cards: PredictPlayCard[]): PredictPlayCard | null {
  if (cards.length === 0) {
    return null;
  }
  const preferred = cards.filter(
    (card) => card.oracle.underlying_asset.toUpperCase() === RANGE_LADDER_PREFERRED_ASSET
  );
  const pool = preferred.length > 0 ? preferred : cards;
  return pool.sort((a, b) => a.oracle.expiry - b.oracle.expiry)[0] ?? null;
}

export function planRangeLadder(
  card: PredictPlayCard,
  totalStakeUsd: number,
  steps = RANGE_LADDER_BAND_STEPS
): PlannedRangeLadder {
  const rawBands = strikeBandAroundAtm(card.atmStrike, card.oracle.tick_size, steps);
  const bandCount = rawBands.length;
  const stakePerBand =
    bandCount > 0 ? Math.max(totalStakeUsd / bandCount, 0.01) : totalStakeUsd;

  const bands: PlannedRangeLadderBand[] = rawBands.map((band) => ({
    lowerStrike: band.lower,
    higherStrike: band.higher,
    label: `${band.lower}-${band.higher}`,
    stakeUsd: stakePerBand,
    quantity: stakeUsdToQuantity(stakePerBand),
  }));

  return {
    card,
    bands,
    totalStakeUsd,
    totalDepositRaw: stakeUsdToDepositRaw(totalStakeUsd),
  };
}

export function plannedLadderToMintBands(plan: PlannedRangeLadder): RangeLadderBandMint[] {
  return plan.bands.map((band) => ({
    lowerStrike: band.lowerStrike,
    higherStrike: band.higherStrike,
    quantity: band.quantity,
  }));
}

export function storedBandsToMintBands(
  bands: { lowerStrike: string; higherStrike: string; quantity: string }[]
): RangeLadderBandMint[] {
  return bands.map((band) => ({
    lowerStrike: BigInt(band.lowerStrike),
    higherStrike: BigInt(band.higherStrike),
    quantity: BigInt(band.quantity),
  }));
}
