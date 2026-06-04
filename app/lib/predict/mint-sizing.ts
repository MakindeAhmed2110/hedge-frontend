import {
  MIN_BET_USD,
  PREDICT_FLOAT_SCALING,
  PREDICT_QUANTITY_UNIT,
} from '~/constants/predict';
import { fetchManagerSummary, fetchOracleState } from '~/lib/predict/predict-server';
import { stakeUsdToDepositRaw } from '~/lib/predict/transactions';

const MIN_QUANTITY = BigInt(Math.round(MIN_BET_USD * Number(PREDICT_QUANTITY_UNIT)));

/** Matches on-chain `math::mul_div_round_up(ask, quantity, FLOAT_SCALING)`. */
function mulQuoteCostRoundUp(askScaled: number, quantity: number): bigint {
  const numerator = BigInt(askScaled) * BigInt(quantity);
  const denominator = PREDICT_FLOAT_SCALING;
  return (numerator + denominator - 1n) / denominator;
}

/**
 * Conservative ask for sizing: protocol max bound, with headroom for post-trade repricing.
 * Mint quotes against vault state *after* the position is inserted, which can raise the ask.
 */
async function maxAskScaledForSizing(oracleId: string): Promise<number> {
  try {
    const state = await fetchOracleState(oracleId);
    if (state.ask_bounds?.max_ask) {
      const max = state.ask_bounds.max_ask;
      const buffered = Math.ceil(max * 1.05);
      return Math.min(Number(PREDICT_FLOAT_SCALING) - 1, buffered);
    }
  } catch {
    // fall through
  }
  return 550_000_000;
}

async function fetchManagerBalanceRaw(managerId: string): Promise<bigint> {
  try {
    const summary = await fetchManagerSummary(managerId);
    return BigInt(summary.balances[0]?.balance ?? 0);
  } catch {
    return 0n;
  }
}

export type MintSizingPreview = {
  depositRaw: bigint;
  quantity: bigint;
  /** DUSDC that must come from the wallet in this transaction. */
  walletDepositUsd: number;
};

/**
 * Size mint so premium ≈ stake, and only deposit the shortfall from wallet
 * (reuse DUSDC already sitting in PredictManager).
 */
export async function resolveMintSizingForStake({
  stakeUsd,
  oracleId,
  managerId,
}: {
  stakeUsd: number;
  oracleId: string;
  managerId: string;
}): Promise<{ depositRaw: bigint; quantity: bigint }> {
  const preview = await previewMintSizingForStake({ stakeUsd, oracleId, managerId });
  return { depositRaw: preview.depositRaw, quantity: preview.quantity };
}

export async function previewMintSizingForStake({
  stakeUsd,
  oracleId,
  managerId,
}: {
  stakeUsd: number;
  oracleId: string;
  managerId: string;
}): Promise<MintSizingPreview> {
  const stakeRaw = stakeUsdToDepositRaw(stakeUsd);
  const maxAskScaled = await maxAskScaledForSizing(oracleId);
  const floatScale = Number(PREDICT_FLOAT_SCALING);

  const quantityNumber = Math.max(
    Number(MIN_QUANTITY),
    Math.floor((Number(stakeRaw) * floatScale) / maxAskScaled)
  );
  const quantity = BigInt(quantityNumber);

  let estimatedCostRaw = mulQuoteCostRoundUp(maxAskScaled, quantityNumber);
  // Post-trade ask can exceed pre-trade bounds after vault.insert_position.
  estimatedCostRaw = (estimatedCostRaw * 120n) / 100n;

  const managerBalance = await fetchManagerBalanceRaw(managerId);
  const depositRaw =
    estimatedCostRaw > managerBalance ? estimatedCostRaw - managerBalance : 0n;

  return {
    depositRaw,
    quantity,
    walletDepositUsd: Number(depositRaw) / 10 ** 6,
  };
}

export type RangeLadderBandSizing = {
  lowerStrike: bigint;
  higherStrike: bigint;
  quantity: bigint;
};

/**
 * Size a multi-band ladder: sum premiums for all bands, one wallet deposit for the shortfall.
 */
export async function resolveRangeLadderSizing(
  bands: { stakeUsd: number; lowerStrike: bigint; higherStrike: bigint }[],
  oracleId: string,
  managerId: string
): Promise<{
  bands: RangeLadderBandSizing[];
  totalDepositRaw: bigint;
  walletDepositUsd: number;
}> {
  const maxAskScaled = await maxAskScaledForSizing(oracleId);
  const floatScale = Number(PREDICT_FLOAT_SCALING);
  const managerBalance = await fetchManagerBalanceRaw(managerId);

  let totalEstimated = 0n;
  const sizedBands: RangeLadderBandSizing[] = [];

  for (const band of bands) {
    const stakeRaw = stakeUsdToDepositRaw(band.stakeUsd);
    const quantityNumber = Math.max(
      Number(MIN_QUANTITY),
      Math.floor((Number(stakeRaw) * floatScale) / maxAskScaled)
    );
    const quantity = BigInt(quantityNumber);
    let estimatedCostRaw = mulQuoteCostRoundUp(maxAskScaled, quantityNumber);
    estimatedCostRaw = (estimatedCostRaw * 120n) / 100n;
    totalEstimated += estimatedCostRaw;
    sizedBands.push({
      lowerStrike: band.lowerStrike,
      higherStrike: band.higherStrike,
      quantity,
    });
  }

  const totalDepositRaw =
    totalEstimated > managerBalance ? totalEstimated - managerBalance : 0n;

  return {
    bands: sizedBands,
    totalDepositRaw,
    walletDepositUsd: Number(totalDepositRaw) / 10 ** 6,
  };
}
