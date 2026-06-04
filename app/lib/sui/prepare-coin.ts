import type { Transaction } from '@mysten/sui/transactions';
import type { TransactionObjectArgument } from '@mysten/sui/transactions';

import { coinObjectRef } from '~/lib/sui/transaction-objects';
import { rpcGetCoins } from '~/lib/sui/rpc';

export class PrepareCoinError extends Error {
  constructor(
    readonly code: 'NO_COINS' | 'INSUFFICIENT',
    message: string
  ) {
    super(message);
    this.name = 'PrepareCoinError';
  }
}

/** Merge wallet coins and split the requested amount for a Move call. */
export async function prepareCoinForAmount(
  tx: Transaction,
  owner: string,
  coinType: string,
  amountRaw: bigint
): Promise<TransactionObjectArgument> {
  const coins = await rpcGetCoins(owner, coinType);
  if (coins.length === 0) {
    throw new PrepareCoinError('NO_COINS', 'No coins found for this asset');
  }

  const total = coins.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
  if (total < amountRaw) {
    throw new PrepareCoinError('INSUFFICIENT', 'Insufficient balance');
  }

  const primary = coinObjectRef(tx, coins[0]);

  if (coins.length > 1) {
    tx.mergeCoins(
      primary,
      coins.slice(1).map((coin) => coinObjectRef(tx, coin))
    );
  }

  if (total === amountRaw) {
    return primary;
  }

  const [splitCoin] = tx.splitCoins(primary, [amountRaw]);
  return splitCoin;
}
