import { Transaction } from '@mysten/sui/transactions';

import { DUSDC_COIN_TYPE } from '~/constants/sui';
import {
  MIN_BET_USD,
  PREDICT_CLOCK_OBJECT_ID,
  PREDICT_GAS_BUDGET,
  PREDICT_OBJECT_ID,
  PREDICT_PACKAGE_ID,
  PREDICT_QUANTITY_UNIT,
} from '~/constants/predict';
import { DUSDC_DECIMALS } from '~/constants/sui';
import { prepareCoinForAmount } from '~/lib/sui/prepare-coin';
import { rpcGetCoins, rpcGetReferenceGasPrice, type SuiCoin } from '~/lib/sui/rpc';
import { predictManagerObjectArg, sharedObjectArg } from '~/lib/sui/transaction-objects';

function predictTarget(module: string, functionName: string): `${string}::${string}::${string}` {
  return `${PREDICT_PACKAGE_ID}::${module}::${functionName}`;
}

function toGasPayment(coins: SuiCoin[]) {
  return coins.map((coin) => ({
    objectId: coin.coinObjectId,
    version: coin.version,
    digest: coin.digest,
  }));
}

function sortSuiCoinsByBalanceDesc(coins: SuiCoin[]): SuiCoin[] {
  return [...coins].sort((a, b) => {
    const diff = BigInt(b.balance) - BigInt(a.balance);
    if (diff > 0n) return 1;
    if (diff < 0n) return -1;
    return 0;
  });
}

async function configurePredictGas(tx: Transaction, senderAddress: string) {
  const suiCoins = sortSuiCoinsByBalanceDesc(
    await rpcGetCoins(senderAddress, '0x2::sui::SUI')
  );
  if (suiCoins.length === 0) {
    throw new Error('You need testnet SUI for gas.');
  }
  const totalMist = suiCoins.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
  if (totalMist < PREDICT_GAS_BUDGET) {
    throw new Error('You need testnet SUI for gas.');
  }
  // All SUI coins fund gas so split balances (e.g. two 0.1 coins) count toward the budget.
  tx.setGasPayment(toGasPayment(suiCoins));
  tx.setGasPrice(await rpcGetReferenceGasPrice());
  tx.setGasBudget(PREDICT_GAS_BUDGET);
}

export async function buildCreateManagerTransaction(senderAddress: string): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);
  tx.moveCall({ target: predictTarget('predict', 'create_manager') });
  return tx;
}

export type MintDirectionalParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  strike: bigint;
  isUp: boolean;
  depositRaw: bigint;
  quantity?: bigint;
  predictId?: string;
};

export async function buildMintDirectionalTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  strike,
  isUp,
  depositRaw,
  quantity = PREDICT_QUANTITY_UNIT,
  predictId = PREDICT_OBJECT_ID,
}: MintDirectionalParams): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  if (depositRaw > 0n) {
    const depositCoin = await prepareCoinForAmount(
      tx,
      senderAddress,
      DUSDC_COIN_TYPE,
      depositRaw
    );
    tx.moveCall({
      target: predictTarget('predict_manager', 'deposit'),
      typeArguments: [DUSDC_COIN_TYPE],
      arguments: [managerArg, depositCoin],
    });
  }

  const marketKey = tx.moveCall({
    target: predictTarget('market_key', 'new'),
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(strike),
      tx.pure.bool(isUp),
    ],
  });

  tx.moveCall({
    target: predictTarget('predict', 'mint'),
    typeArguments: [DUSDC_COIN_TYPE],
    arguments: [
      predictArg,
      managerArg,
      oracleArg,
      marketKey,
      tx.pure.u64(quantity),
      clockArg,
    ],
  });

  return tx;
}

export type MintRangeParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  lowerStrike: bigint;
  higherStrike: bigint;
  depositRaw: bigint;
  quantity?: bigint;
  predictId?: string;
};

export async function buildMintRangeTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  lowerStrike,
  higherStrike,
  depositRaw,
  quantity = PREDICT_QUANTITY_UNIT,
  predictId = PREDICT_OBJECT_ID,
}: MintRangeParams): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  if (depositRaw > 0n) {
    const depositCoin = await prepareCoinForAmount(
      tx,
      senderAddress,
      DUSDC_COIN_TYPE,
      depositRaw
    );
    tx.moveCall({
      target: predictTarget('predict_manager', 'deposit'),
      typeArguments: [DUSDC_COIN_TYPE],
      arguments: [managerArg, depositCoin],
    });
  }

  const rangeKey = tx.moveCall({
    target: predictTarget('range_key', 'new'),
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(lowerStrike),
      tx.pure.u64(higherStrike),
    ],
  });

  tx.moveCall({
    target: predictTarget('predict', 'mint_range'),
    typeArguments: [DUSDC_COIN_TYPE],
    arguments: [
      predictArg,
      managerArg,
      oracleArg,
      rangeKey,
      tx.pure.u64(quantity),
      clockArg,
    ],
  });

  return tx;
}

export type RedeemRangeParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  lowerStrike: bigint;
  higherStrike: bigint;
  quantity: bigint;
  predictId?: string;
};

export async function buildRedeemRangeTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  lowerStrike,
  higherStrike,
  quantity,
  predictId = PREDICT_OBJECT_ID,
}: RedeemRangeParams): Promise<Transaction> {
  if (quantity <= 0n) {
    throw new Error('Redeem quantity must be greater than zero.');
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  const rangeKey = tx.moveCall({
    target: predictTarget('range_key', 'new'),
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(lowerStrike),
      tx.pure.u64(higherStrike),
    ],
  });

  tx.moveCall({
    target: predictTarget('predict', 'redeem_range'),
    typeArguments: [DUSDC_COIN_TYPE],
    arguments: [
      predictArg,
      managerArg,
      oracleArg,
      rangeKey,
      tx.pure.u64(quantity),
      clockArg,
    ],
  });

  return tx;
}

export type RangeLadderBandMint = {
  lowerStrike: bigint;
  higherStrike: bigint;
  quantity: bigint;
};

export type DeployRangeLadderParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  totalDepositRaw: bigint;
  bands: RangeLadderBandMint[];
  predictId?: string;
};

/** Single deposit, then mint_range for each band (uses manager balance after deposit). */
export async function buildDeployRangeLadderTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  totalDepositRaw,
  bands,
  predictId = PREDICT_OBJECT_ID,
}: DeployRangeLadderParams): Promise<Transaction> {
  if (bands.length === 0) {
    throw new Error('Range ladder needs at least one band.');
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  if (totalDepositRaw > 0n) {
    const depositCoin = await prepareCoinForAmount(
      tx,
      senderAddress,
      DUSDC_COIN_TYPE,
      totalDepositRaw
    );
    tx.moveCall({
      target: predictTarget('predict_manager', 'deposit'),
      typeArguments: [DUSDC_COIN_TYPE],
      arguments: [managerArg, depositCoin],
    });
  }

  for (const band of bands) {
    if (band.quantity <= 0n) {
      throw new Error('Band quantity must be greater than zero.');
    }
    const rangeKey = tx.moveCall({
      target: predictTarget('range_key', 'new'),
      arguments: [
        tx.pure.id(oracleId),
        tx.pure.u64(expiry),
        tx.pure.u64(band.lowerStrike),
        tx.pure.u64(band.higherStrike),
      ],
    });
    tx.moveCall({
      target: predictTarget('predict', 'mint_range'),
      typeArguments: [DUSDC_COIN_TYPE],
      arguments: [
        predictArg,
        managerArg,
        oracleArg,
        rangeKey,
        tx.pure.u64(band.quantity),
        clockArg,
      ],
    });
  }

  return tx;
}

export type RedeemRangeLadderParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  bands: RangeLadderBandMint[];
  predictId?: string;
};

export async function buildRedeemRangeLadderTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  bands,
  predictId = PREDICT_OBJECT_ID,
}: RedeemRangeLadderParams): Promise<Transaction> {
  if (bands.length === 0) {
    throw new Error('Nothing to redeem.');
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  for (const band of bands) {
    if (band.quantity <= 0n) {
      continue;
    }
    const rangeKey = tx.moveCall({
      target: predictTarget('range_key', 'new'),
      arguments: [
        tx.pure.id(oracleId),
        tx.pure.u64(expiry),
        tx.pure.u64(band.lowerStrike),
        tx.pure.u64(band.higherStrike),
      ],
    });
    tx.moveCall({
      target: predictTarget('predict', 'redeem_range'),
      typeArguments: [DUSDC_COIN_TYPE],
      arguments: [
        predictArg,
        managerArg,
        oracleArg,
        rangeKey,
        tx.pure.u64(band.quantity),
        clockArg,
      ],
    });
  }

  return tx;
}

const DEPOSIT_SCALE = 10 ** DUSDC_DECIMALS;
const MIN_DEPOSIT_RAW = BigInt(Math.round(MIN_BET_USD * DEPOSIT_SCALE));
const MIN_QUANTITY = BigInt(Math.round(MIN_BET_USD * Number(PREDICT_QUANTITY_UNIT)));

export function stakeUsdToDepositRaw(stakeUsd: number): bigint {
  const raw = BigInt(Math.round(stakeUsd * DEPOSIT_SCALE));
  return raw < MIN_DEPOSIT_RAW ? MIN_DEPOSIT_RAW : raw;
}

export function stakeUsdToQuantity(stakeUsd: number): bigint {
  const quantity = BigInt(Math.round(stakeUsd * Number(PREDICT_QUANTITY_UNIT)));
  return quantity < MIN_QUANTITY ? MIN_QUANTITY : quantity;
}

export type RedeemDirectionalParams = {
  senderAddress: string;
  managerId: string;
  oracleId: string;
  expiry: number;
  strike: bigint;
  isUp: boolean;
  quantity: bigint;
  predictId?: string;
};

export async function buildRedeemDirectionalTransaction({
  senderAddress,
  managerId,
  oracleId,
  expiry,
  strike,
  isUp,
  quantity,
  predictId = PREDICT_OBJECT_ID,
}: RedeemDirectionalParams): Promise<Transaction> {
  if (quantity <= 0n) {
    throw new Error('Close quantity must be greater than zero.');
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const [managerArg, predictArg, oracleArg, clockArg] = await Promise.all([
    predictManagerObjectArg(tx, managerId),
    sharedObjectArg(tx, predictId, true),
    sharedObjectArg(tx, oracleId, true),
    sharedObjectArg(tx, PREDICT_CLOCK_OBJECT_ID, false),
  ]);

  const marketKey = tx.moveCall({
    target: predictTarget('market_key', 'new'),
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(strike),
      tx.pure.bool(isUp),
    ],
  });

  tx.moveCall({
    target: predictTarget('predict', 'redeem'),
    typeArguments: [DUSDC_COIN_TYPE],
    arguments: [
      predictArg,
      managerArg,
      oracleArg,
      marketKey,
      tx.pure.u64(quantity),
      clockArg,
    ],
  });

  return tx;
}

export type WithdrawFromManagerParams = {
  senderAddress: string;
  managerId: string;
  amountRaw: bigint;
};

export async function buildWithdrawFromManagerTransaction({
  senderAddress,
  managerId,
  amountRaw,
}: WithdrawFromManagerParams): Promise<Transaction> {
  if (amountRaw <= 0n) {
    throw new Error('Withdraw amount must be greater than zero.');
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);
  await configurePredictGas(tx, senderAddress);

  const managerArg = await predictManagerObjectArg(tx, managerId);

  const [withdrawnCoin] = tx.moveCall({
    target: predictTarget('predict_manager', 'withdraw'),
    typeArguments: [DUSDC_COIN_TYPE],
    arguments: [managerArg, tx.pure.u64(amountRaw)],
  });

  tx.transferObjects([withdrawnCoin], senderAddress);

  return tx;
}
