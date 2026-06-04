import { toBase64 } from '@mysten/sui/utils';

import { SUI_TESTNET_RPC_URL } from '~/constants/sui';
import {
  assertTransactionSucceeded,
  type ExecuteTransactionBlockResult,
} from '~/lib/sui/transaction-result';

type JsonRpcResponse<T> = {
  result?: T;
  error?: { message: string };
};

async function suiRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(SUI_TESTNET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sui RPC HTTP ${response.status}`);
  }

  const json = (await response.json()) as JsonRpcResponse<T>;
  if (json.error) {
    throw new Error(json.error.message || 'Sui RPC error');
  }
  if (json.result === undefined) {
    throw new Error('Sui RPC returned no result');
  }
  return json.result;
}

export type SuiCoin = {
  coinObjectId: string;
  balance: string;
  digest: string;
  version: string;
};

export async function rpcGetBalance(owner: string, coinType: string): Promise<string> {
  const result = await suiRpc<{ totalBalance: string }>('suix_getBalance', [owner, coinType]);
  return result.totalBalance;
}

export async function rpcGetCoins(owner: string, coinType: string): Promise<SuiCoin[]> {
  const result = await suiRpc<{ data: SuiCoin[] }>('suix_getCoins', [owner, coinType, null, null]);
  return result.data ?? [];
}

export async function rpcGetReferenceGasPrice(): Promise<bigint> {
  const gasPrice = await suiRpc<string | number>('suix_getReferenceGasPrice', []);
  return BigInt(gasPrice);
}

export type SuiBalanceChange = {
  owner?: { AddressOwner?: string; ObjectOwner?: string };
  coinType: string;
  amount: string;
};

export type SuiTransactionEvent = {
  type?: string;
  parsedJson?: Record<string, unknown>;
};

export type SuiTransactionBlock = {
  digest: string;
  timestampMs?: string | null;
  balanceChanges?: SuiBalanceChange[] | null;
  events?: SuiTransactionEvent[] | null;
  /** Present when `showInput: true` on query options (used for Predict activity labels). */
  transaction?: unknown;
};

export type SuiTransactionBlocksPage = {
  data: SuiTransactionBlock[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

const TX_QUERY_OPTIONS = {
  showBalanceChanges: true,
  showEffects: true,
  showEvents: true,
  showInput: true,
};

export async function rpcQueryTransactionBlocks(
  filter: Record<string, unknown>,
  limit = 50,
  cursor: string | null = null
): Promise<SuiTransactionBlocksPage> {
  const result = await suiRpc<SuiTransactionBlocksPage>('suix_queryTransactionBlocks', [
    {
      filter,
      options: TX_QUERY_OPTIONS,
    },
    cursor,
    limit,
    true,
  ]);
  return {
    data: result.data ?? [],
    nextCursor: result.nextCursor ?? null,
    hasNextPage: Boolean(result.hasNextPage),
  };
}

export type SuiTransactionBlockDetails = {
  digest: string;
  events?: Array<{
    type?: string;
    parsedJson?: Record<string, unknown>;
  }>;
};

export async function rpcGetTransactionBlock(
  digest: string
): Promise<SuiTransactionBlockDetails> {
  return suiRpc<SuiTransactionBlockDetails>('sui_getTransactionBlock', [
    digest,
    { showEvents: true },
  ]);
}

export async function rpcExecuteTransactionBlock(
  transactionBlock: Uint8Array,
  signature: string
): Promise<ExecuteTransactionBlockResult> {
  const txBase64 = toBase64(transactionBlock);
  const result = await suiRpc<ExecuteTransactionBlockResult>('sui_executeTransactionBlock', [
    txBase64,
    [signature],
    { showEffects: true },
    'WaitForEffectsCert',
  ]);
  assertTransactionSucceeded(result);
  return result;
}
