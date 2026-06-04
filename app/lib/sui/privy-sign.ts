import { toSerializedSignature } from '@mysten/sui/cryptography';
import type { Transaction } from '@mysten/sui/transactions';
import { fromHex, toBase64 } from '@mysten/sui/utils';
import { verifyTransactionSignature } from '@mysten/sui/verify';

import {
  buildSuiTransactionDigestHex,
} from '~/lib/sui/intent-signing';
import { ed25519PublicKeyFromPrivy } from '~/lib/sui/public-key';
import { rpcExecuteTransactionBlock } from '~/lib/sui/rpc';
import { resolveApiUrl } from "~/lib/utils/api-url";
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export type PrivySignRawHash = (input: {
  address: string;
  chainType: 'sui';
  hash: `0x${string}`;
}) => Promise<{ signature: `0x${string}` }>;

function hexToBytes(hex: string): Uint8Array {
  return fromHex(hex);
}

/**
 * Privy server `raw_sign`: hex intent message + blake2b256 (see Sui intent-signing docs).
 */
async function signViaPrivyApiRoute(
  rawBytes: Uint8Array,
  senderAddress: string,
  getAccessToken: () => Promise<string | null>
): Promise<{ signature: `0x${string}`; publicKey: string | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const transactionBlock = toBase64(rawBytes);
  const response = await fetch(resolveApiUrl("/api/wallets/sui-sign"), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionBlock,
      address: senderAddress,
    }),
  });

  const payload = (await response.json()) as {
    signature?: string;
    publicKey?: string | null;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Sign API failed (${response.status})`);
  }

  if (!payload.signature) {
    throw new Error('Sign API returned no signature');
  }

  const signature = payload.signature.startsWith('0x')
    ? payload.signature
    : `0x${payload.signature}`;

  return {
    signature: signature as `0x${string}`,
    publicKey: payload.publicKey ?? null,
  };
}

/**
 * Device fallback: signs Blake2b-256 digest of `messageWithIntent('TransactionData', rawBytes)`.
 * Equivalent to Privy raw_sign with `encoding: hex` and `hash_function: blake2b256`.
 */
async function signViaRawHash(
  rawBytes: Uint8Array,
  senderAddress: string,
  signRawHash: PrivySignRawHash
): Promise<`0x${string}`> {
  const digest = buildSuiTransactionDigestHex(rawBytes);
  const { signature } = await signRawHash({
    address: senderAddress,
    chainType: 'sui',
    hash: digest,
  });
  return signature;
}

/**
 * Build, sign (Privy), verify, and execute a Sui transaction.
 * Follows https://docs.sui.io/develop/transactions/transaction-auth/intent-signing
 */
export async function signAndExecuteTransaction({
  transaction,
  senderAddress,
  publicKey,
  publicKeyFromPrivy,
  signRawHash,
  getAccessToken,
}: {
  transaction: Transaction;
  senderAddress: string;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
}) {
  transaction.setSenderIfNotSet(senderAddress);
  // Caller must set gas payment, price, and budget (offline build; no Sui JSON-RPC client).
  const rawBytes = await transaction.build({});

  let rawSignatureHex: `0x${string}`;
  let resolvedPublicKey = publicKey;

  if (getAccessToken) {
    try {
      const apiSign = await signViaPrivyApiRoute(rawBytes, senderAddress, getAccessToken);
      rawSignatureHex = apiSign.signature;
      if (apiSign.publicKey) {
        resolvedPublicKey = ed25519PublicKeyFromPrivy(apiSign.publicKey, senderAddress);
      }
    } catch (apiError) {
      const reason = apiError instanceof Error ? apiError.message : 'API sign failed';
      try {
        rawSignatureHex = await signViaRawHash(rawBytes, senderAddress, signRawHash);
      } catch (rawError) {
        const rawReason = rawError instanceof Error ? rawError.message : 'sign failed';
        throw new Error(`${reason}. Fallback sign: ${rawReason}`);
      }
    }
  } else {
    rawSignatureHex = await signViaRawHash(rawBytes, senderAddress, signRawHash);
  }

  if (!resolvedPublicKey) {
    if (!publicKeyFromPrivy) {
      throw new Error('Wallet public key is missing. Sign out and sign in again.');
    }
    resolvedPublicKey = ed25519PublicKeyFromPrivy(publicKeyFromPrivy, senderAddress);
  }

  const txSignature = toSerializedSignature({
    signature: hexToBytes(rawSignatureHex),
    signatureScheme: 'ED25519',
    publicKey: resolvedPublicKey,
  });

  const signer = await verifyTransactionSignature(rawBytes, txSignature, {
    address: senderAddress,
  });

  if (signer.toSuiAddress() !== senderAddress) {
    throw new Error('Verified signer does not match the sender address.');
  }

  return rpcExecuteTransactionBlock(rawBytes, txSignature);
}
