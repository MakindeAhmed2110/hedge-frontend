import { Transaction } from '@mysten/sui/transactions';
import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';

import type { SendTokenConfig } from '~/constants/send-tokens';
import {
  SUI_GAS_RESERVE_MIST,
  TESTNET_SUI_COIN_TYPE,
} from '~/constants/send-tokens';
import { SUI_COIN_TYPE } from '~/constants/sui';
import { fetchSuiBalanceMist } from '~/lib/sui/balances';
import { SendTokenError } from '~/lib/sui/send-errors';
import type { PrivySignRawHash } from '~/lib/sui/privy-sign';
import { signAndExecuteTransaction } from '~/lib/sui/privy-sign';
import {
  rpcGetCoins,
  rpcGetReferenceGasPrice,
  type SuiCoin,
} from '~/lib/sui/rpc';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export { SendTokenError } from '~/lib/sui/send-errors';

/** Gas budget for simple transfer transactions (MIST). */
const SEND_GAS_BUDGET_MIST = 10_000_000n;

function toGasPayment(coins: SuiCoin[]) {
  return coins.map((coin) => ({
    objectId: coin.coinObjectId,
    version: coin.version,
    digest: coin.digest,
  }));
}

/** Resolved object ref — `tx.object(id)` alone leaves UnresolvedObject and requires a Sui client at build. */
function coinRef(tx: Transaction, coin: SuiCoin) {
  return tx.objectRef({
    objectId: coin.coinObjectId,
    version: coin.version,
    digest: coin.digest,
  });
}

async function configureTransactionGas(tx: Transaction, primaryGasCoin: SuiCoin) {
  // Only one coin in gas payment; extra SUI coins are merged in via mergeCoins(tx.gas, …).
  tx.setGasPayment(toGasPayment([primaryGasCoin]));
  tx.setGasPrice(await rpcGetReferenceGasPrice());
  tx.setGasBudget(SEND_GAS_BUDGET_MIST);
}

/** Merge additional SUI coins into the gas coin (they must not also be listed in setGasPayment). */
function mergeExtraCoinsIntoGas(tx: Transaction, extraCoins: SuiCoin[]) {
  if (extraCoins.length === 0) return;
  tx.mergeCoins(
    tx.gas,
    extraCoins.map((coin) => coinRef(tx, coin))
  );
}

/** Send native SUI from the gas coin after optional merges. */
function buildSuiTransfer(tx: Transaction, amountRaw: bigint, recipient: string) {
  const [payment] = tx.splitCoins(tx.gas, [amountRaw]);
  tx.transferObjects([payment], recipient);
}

function buildTokenTransfer(
  tx: Transaction,
  coins: SuiCoin[],
  amountRaw: bigint,
  recipient: string
) {
  const primary = coinRef(tx, coins[0]);

  if (coins.length > 1) {
    tx.mergeCoins(
      primary,
      coins.slice(1).map((coin) => coinRef(tx, coin))
    );
  }

  const [transferCoin] = tx.splitCoins(primary, [amountRaw]);
  tx.transferObjects([transferCoin], recipient);
}

export async function sendCoin({
  token,
  senderAddress,
  recipientAddress,
  amountRaw,
  publicKey,
  publicKeyFromPrivy,
  signRawHash,
  getAccessToken,
}: {
  token: SendTokenConfig;
  senderAddress: string;
  recipientAddress: string;
  amountRaw: bigint;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
}) {
  const trimmedRecipient = recipientAddress.trim();
  if (!isValidSuiAddress(trimmedRecipient)) {
    throw new SendTokenError('INVALID_ADDRESS', 'Invalid Sui address');
  }
  const recipient = normalizeSuiAddress(trimmedRecipient);

  if (amountRaw <= 0n) {
    throw new SendTokenError('INSUFFICIENT_BALANCE', 'Amount must be greater than zero');
  }

  const suiMist = await fetchSuiBalanceMist(senderAddress);
  const isSendingSui =
    token.coinType === TESTNET_SUI_COIN_TYPE || token.coinType === SUI_COIN_TYPE;

  if (suiMist === 0n) {
    throw new SendTokenError('NO_SUI_GAS', 'You need testnet SUI for gas. Use Receive faucet first.');
  }

  if (isSendingSui && amountRaw + SUI_GAS_RESERVE_MIST > suiMist) {
    throw new SendTokenError(
      'INSUFFICIENT_BALANCE',
      'Amount plus gas reserve exceeds your SUI balance'
    );
  }

  const coins = await rpcGetCoins(senderAddress, token.coinType);

  if (coins.length === 0) {
    throw new SendTokenError('NO_BALANCE', `No ${token.symbol} balance on testnet`);
  }

  const total = coins.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
  if (total < amountRaw) {
    throw new SendTokenError('INSUFFICIENT_BALANCE', `Insufficient ${token.symbol} balance`);
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);

  if (isSendingSui) {
    await configureTransactionGas(tx, coins[0]);
    mergeExtraCoinsIntoGas(tx, coins.slice(1));
    buildSuiTransfer(tx, amountRaw, recipient);
  } else {
    const gasCoins = await rpcGetCoins(senderAddress, TESTNET_SUI_COIN_TYPE);
    if (gasCoins.length === 0) {
      throw new SendTokenError(
        'NO_SUI_GAS',
        'You need testnet SUI for gas. Use Receive faucet first.'
      );
    }
    await configureTransactionGas(tx, gasCoins[0]);
    mergeExtraCoinsIntoGas(tx, gasCoins.slice(1));
    buildTokenTransfer(tx, coins, amountRaw, recipient);
  }

  try {
    return await signAndExecuteTransaction({
      transaction: tx,
      senderAddress,
      publicKey,
      publicKeyFromPrivy,
      signRawHash,
      getAccessToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    throw new SendTokenError('SEND_FAILED', message);
  }
}
