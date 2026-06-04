import type { Transaction } from '@mysten/sui/transactions';

import { SUI_TESTNET_RPC_URL } from '~/constants/sui';
import type { SuiCoin } from '~/lib/sui/rpc';

type SuiObjectData = {
  objectId: string;
  version: string;
  digest: string;
  owner?: {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: { initial_shared_version: number | string };
  };
};

async function rpcGetObjectData(objectId: string): Promise<SuiObjectData> {
  const response = await fetch(SUI_TESTNET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_getObject',
      params: [objectId, { showOwner: true, showContent: false }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Sui RPC HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    result?: { data?: SuiObjectData };
    error?: { message: string };
  };

  if (json.error) {
    throw new Error(json.error.message || 'sui_getObject failed');
  }

  const data = json.result?.data;
  if (!data) {
    throw new Error(`Object not found: ${objectId}`);
  }

  return data;
}

export function coinObjectRef(tx: Transaction, coin: SuiCoin) {
  return tx.objectRef({
    objectId: coin.coinObjectId,
    version: coin.version,
    digest: coin.digest,
  });
}

export async function ownedObjectArg(tx: Transaction, objectId: string) {
  const data = await rpcGetObjectData(objectId);
  return tx.objectRef({
    objectId: data.objectId,
    version: data.version,
    digest: data.digest,
  });
}

export async function sharedObjectArg(
  tx: Transaction,
  objectId: string,
  mutable: boolean
) {
  const data = await rpcGetObjectData(objectId);
  const shared = data.owner?.Shared;
  if (!shared) {
    throw new Error(`Expected shared object: ${objectId}`);
  }

  return tx.sharedObjectRef({
    objectId: data.objectId,
    initialSharedVersion: Number(shared.initial_shared_version),
    mutable,
  });
}

/** PredictManager is a shared object on current testnet (see predict README). */
export async function predictManagerObjectArg(tx: Transaction, managerId: string) {
  const data = await rpcGetObjectData(managerId);
  if (data.owner?.Shared) {
    return tx.sharedObjectRef({
      objectId: data.objectId,
      initialSharedVersion: Number(data.owner.Shared.initial_shared_version),
      mutable: true,
    });
  }
  if (data.owner?.AddressOwner) {
    return tx.objectRef({
      objectId: data.objectId,
      version: data.version,
      digest: data.digest,
    });
  }
  throw new Error(`Unsupported PredictManager owner for ${managerId}`);
}
