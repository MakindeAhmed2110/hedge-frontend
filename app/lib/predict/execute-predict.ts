import type { Transaction } from '@mysten/sui/transactions';

import { resolveMintSizingForStake, resolveRangeLadderSizing } from '~/lib/predict/mint-sizing';
import { findManagerForOwner } from '~/lib/predict/predict-server';
import { FIXED_MINT_DEPOSIT_RAW, FIXED_MINT_QUANTITY } from '~/constants/predict';
import { DEFAULT_STAKE_SELECTION_ENABLED } from '~/constants/trading-preferences';
import {
  buildCreateManagerTransaction,
  buildDeployRangeLadderTransaction,
  buildMintDirectionalTransaction,
  buildMintRangeTransaction,
  buildRedeemDirectionalTransaction,
  buildRedeemRangeLadderTransaction,
  buildRedeemRangeTransaction,
  buildWithdrawFromManagerTransaction,
  stakeUsdToDepositRaw,
  stakeUsdToQuantity,
  type MintDirectionalParams,
  type MintRangeParams,
  type RedeemDirectionalParams,
  type RedeemRangeParams,
  type WithdrawFromManagerParams,
} from '~/lib/predict/transactions';
import {
  clearStoredRangeLadderDeployment,
  deploymentFromPlan,
  setStoredRangeLadderDeployment,
  type StoredRangeLadderDeployment,
} from '~/lib/preferences/range-ladder-vault';
import {
  planRangeLadder,
  plannedLadderToMintBands,
  selectVaultTargetCard,
  storedBandsToMintBands,
  type PlannedRangeLadder,
} from '~/lib/predict/range-ladder';
import { fetchOracleState } from '~/lib/predict/predict-server';
import type { PredictPlayCard } from '~/lib/predict/types';
import {
  clearStoredPredictManagerId,
  getStoredPredictManagerId,
  setStoredPredictManagerId,
} from '~/lib/preferences/predict-manager';
import type { PrivySignRawHash } from '~/lib/sui/privy-sign';
import { signAndExecuteTransaction } from '~/lib/sui/privy-sign';
import { rpcGetTransactionBlock } from '~/lib/sui/rpc';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

function resolveMintSizing(options: {
  stakeUsd?: number;
  depositRaw?: bigint;
  quantity?: bigint;
  skipDeposit?: boolean;
}): { depositRaw: bigint; quantity: bigint } {
  if (options.skipDeposit) {
    return {
      depositRaw: 0n,
      quantity: options.quantity ?? FIXED_MINT_QUANTITY,
    };
  }

  if (options.stakeUsd != null && options.stakeUsd > 0) {
    return {
      depositRaw: options.depositRaw ?? stakeUsdToDepositRaw(options.stakeUsd),
      quantity: options.quantity ?? stakeUsdToQuantity(options.stakeUsd),
    };
  }

  if (!DEFAULT_STAKE_SELECTION_ENABLED) {
    return {
      depositRaw: options.depositRaw ?? FIXED_MINT_DEPOSIT_RAW,
      quantity: options.quantity ?? FIXED_MINT_QUANTITY,
    };
  }

  const stakeUsd = options.stakeUsd ?? 10;
  return {
    depositRaw: options.depositRaw ?? stakeUsdToDepositRaw(stakeUsd),
    quantity: options.quantity ?? stakeUsdToQuantity(stakeUsd),
  };
}

export class PredictTradeError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'PredictTradeError';
  }
}

type SignContext = {
  senderAddress: string;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
};

function mapPredictExecutionError(err: unknown): PredictTradeError {
  if (err instanceof PredictTradeError) {
    return err;
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('testnet SUI for gas')) {
    return new PredictTradeError(message, 'NO_SUI_GAS');
  }
  if (
    message.includes('Balance of gas object') ||
    message.includes('lower than the needed amount')
  ) {
    return new PredictTradeError(
      'Not enough SUI in your wallet to cover network fees. Request more testnet SUI and try again.',
      'INSUFFICIENT_SUI_GAS'
    );
  }
  if (
    message.includes('withdraw_with_proof') ||
    message.includes('balance_manager') ||
    message.includes('MoveAbort')
  ) {
    return new PredictTradeError(
      'Not enough DUSDC in your Predict account for this bet. Try a smaller amount or ensure your wallet can top up the manager.',
      'insufficient_manager_balance'
    );
  }
  return new PredictTradeError(message);
}

async function executeTx(tx: Transaction, ctx: SignContext) {
  try {
    return await signAndExecuteTransaction({
      transaction: tx,
      senderAddress: ctx.senderAddress,
      publicKey: ctx.publicKey,
      publicKeyFromPrivy: ctx.publicKeyFromPrivy,
      signRawHash: ctx.signRawHash,
      getAccessToken: ctx.getAccessToken,
    });
  } catch (err) {
    throw mapPredictExecutionError(err);
  }
}

function parseManagerIdFromTransaction(digest: string): Promise<string | null> {
  return rpcGetTransactionBlock(digest).then((block) => {
    const events = block.events ?? [];
    for (const event of events) {
      const parsed = event.parsedJson as { manager_id?: string } | undefined;
      if (parsed?.manager_id) {
        return parsed.manager_id;
      }
    }
    return null;
  });
}

export async function resolvePredictManagerId(owner: string): Promise<string | null> {
  const cached = await getStoredPredictManagerId(owner);
  if (cached) {
    return cached;
  }
  const remote = await findManagerForOwner(owner);
  if (remote) {
    await setStoredPredictManagerId(owner, remote.manager_id);
  }
  return remote?.manager_id ?? null;
}

export async function createPredictManager(ctx: SignContext): Promise<string> {
  const existing = await resolvePredictManagerId(ctx.senderAddress);
  if (existing) {
    return existing;
  }

  const tx = await buildCreateManagerTransaction(ctx.senderAddress);
  const result = await executeTx(tx, ctx);
  const digest = result.digest;
  if (!digest) {
    throw new PredictTradeError('Create manager succeeded but digest is missing');
  }

  let managerId = await parseManagerIdFromTransaction(digest);
  if (!managerId) {
    const remote = await findManagerForOwner(ctx.senderAddress);
    managerId = remote?.manager_id ?? null;
  }
  if (!managerId) {
    throw new PredictTradeError(
      'PredictManager was created but could not be resolved. Pull to refresh in a moment.'
    );
  }

  await setStoredPredictManagerId(ctx.senderAddress, managerId);
  return managerId;
}

export async function mintDirectionalPosition(
  params: Omit<MintDirectionalParams, 'depositRaw' | 'quantity' | 'managerId'> & {
    stakeUsd?: number;
    depositRaw?: bigint;
    quantity?: bigint;
    skipDeposit?: boolean;
  },
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const { depositRaw, quantity } =
    params.depositRaw != null && params.quantity != null
      ? { depositRaw: params.depositRaw, quantity: params.quantity }
      : params.stakeUsd != null
        ? await resolveMintSizingForStake({
            stakeUsd: params.stakeUsd,
            oracleId: params.oracleId,
            managerId,
          })
        : resolveMintSizing(params);

  const tx = await buildMintDirectionalTransaction({
    ...params,
    managerId,
    depositRaw,
    quantity,
  });

  return executeTx(tx, ctx);
}

export async function mintRangePosition(
  params: Omit<MintRangeParams, 'depositRaw' | 'quantity' | 'managerId'> & {
    stakeUsd?: number;
    depositRaw?: bigint;
    quantity?: bigint;
    skipDeposit?: boolean;
  },
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const { depositRaw, quantity } =
    params.depositRaw != null && params.quantity != null
      ? { depositRaw: params.depositRaw, quantity: params.quantity }
      : params.stakeUsd != null
        ? await resolveMintSizingForStake({
            stakeUsd: params.stakeUsd,
            oracleId: params.oracleId,
            managerId,
          })
        : resolveMintSizing(params);

  const tx = await buildMintRangeTransaction({
    ...params,
    managerId,
    depositRaw,
    quantity,
  });

  return executeTx(tx, ctx);
}

export async function redeemDirectionalPosition(
  params: Omit<RedeemDirectionalParams, 'managerId'>,
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const tx = await buildRedeemDirectionalTransaction({
    ...params,
    managerId,
  });

  return executeTx(tx, ctx);
}

export async function withdrawFromPredictManager(
  params: Omit<WithdrawFromManagerParams, 'managerId'>,
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const tx = await buildWithdrawFromManagerTransaction({
    ...params,
    managerId,
  });

  return executeTx(tx, ctx);
}

export async function refreshPredictManagerCache(owner: string) {
  await clearStoredPredictManagerId(owner);
  return resolvePredictManagerId(owner);
}

export async function redeemRangePosition(
  params: Omit<RedeemRangeParams, 'managerId'>,
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const tx = await buildRedeemRangeTransaction({
    ...params,
    managerId,
  });

  return executeTx(tx, ctx);
}

export async function deployRangeLadderVault(
  params: {
    card: PredictPlayCard;
    totalStakeUsd: number;
    totalDepositRaw?: bigint;
    skipPersist?: boolean;
  },
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const plan = planRangeLadder(params.card, params.totalStakeUsd);
  const sized = await resolveRangeLadderSizing(
    plan.bands.map((band) => ({
      stakeUsd: band.stakeUsd,
      lowerStrike: band.lowerStrike,
      higherStrike: band.higherStrike,
    })),
    plan.card.oracle.oracle_id,
    managerId
  );
  const tx = await buildDeployRangeLadderTransaction({
    senderAddress: ctx.senderAddress,
    managerId,
    oracleId: plan.card.oracle.oracle_id,
    expiry: plan.card.oracle.expiry,
    totalDepositRaw: params.totalDepositRaw ?? sized.totalDepositRaw,
    bands: sized.bands,
  });

  const result = await executeTx(tx, ctx);
  if (!params.skipPersist) {
    await setStoredRangeLadderDeployment(ctx.senderAddress, deploymentFromPlan(plan));
  }
  return { result, plan };
}

export async function redeemStoredRangeLadder(
  deployment: StoredRangeLadderDeployment,
  ctx: SignContext
) {
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const bands = storedBandsToMintBands(deployment.bands);
  if (bands.every((band) => band.quantity <= 0n)) {
    throw new PredictTradeError('No open range quantity to redeem.');
  }

  const tx = await buildRedeemRangeLadderTransaction({
    senderAddress: ctx.senderAddress,
    managerId,
    oracleId: deployment.oracleId,
    expiry: deployment.expiry,
    bands,
  });

  return executeTx(tx, ctx);
}

/** Redeem all ladder bands and clear local deployment (DUSDC returns to PredictManager). */
export async function closeRangeLadderVault(
  deployment: StoredRangeLadderDeployment,
  ctx: SignContext
) {
  const result = await redeemStoredRangeLadder(deployment, ctx);
  await clearStoredRangeLadderDeployment(ctx.senderAddress);
  return result;
}

export async function rollRangeLadderVault(
  params: {
    deployment: StoredRangeLadderDeployment;
    nextCard: PredictPlayCard;
    totalStakeUsd: number;
  },
  ctx: SignContext
) {
  await redeemStoredRangeLadder(params.deployment, ctx);

  const plan = planRangeLadder(params.nextCard, params.totalStakeUsd);
  const managerId = await resolvePredictManagerId(ctx.senderAddress);
  if (!managerId) {
    throw new PredictTradeError('Create your Predict account first.');
  }

  const sized = await resolveRangeLadderSizing(
    plan.bands.map((band) => ({
      stakeUsd: band.stakeUsd,
      lowerStrike: band.lowerStrike,
      higherStrike: band.higherStrike,
    })),
    plan.card.oracle.oracle_id,
    managerId
  );

  const tx = await buildDeployRangeLadderTransaction({
    senderAddress: ctx.senderAddress,
    managerId,
    oracleId: plan.card.oracle.oracle_id,
    expiry: plan.card.oracle.expiry,
    totalDepositRaw: sized.totalDepositRaw,
    bands: sized.bands,
  });

  const result = await executeTx(tx, ctx);
  await setStoredRangeLadderDeployment(ctx.senderAddress, deploymentFromPlan(plan));
  return { result, plan };
}

export async function canRollRangeLadder(deployment: StoredRangeLadderDeployment): Promise<boolean> {
  try {
    const state = await fetchOracleState(deployment.oracleId);
    const status = state.oracle.status;
    return status === 'settled' || status === 'pending_settlement';
  } catch {
    return false;
  }
}

export function pickRollTargetCard(
  cards: PredictPlayCard[],
  deployment: StoredRangeLadderDeployment
): PredictPlayCard | null {
  const asset = deployment.underlyingAsset.toUpperCase();
  const candidates = cards.filter(
    (card) =>
      card.oracle.underlying_asset.toUpperCase() === asset &&
      card.oracle.oracle_id !== deployment.oracleId
  );
  if (candidates.length > 0) {
    return candidates.sort((a, b) => a.oracle.expiry - b.oracle.expiry)[0] ?? null;
  }
  return selectVaultTargetCard(cards);
}
