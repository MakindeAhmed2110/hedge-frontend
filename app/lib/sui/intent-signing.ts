import { messageWithIntent } from '@mysten/sui/cryptography';
import { toHex } from '@mysten/sui/utils';
import { blake2b } from '@noble/hashes/blake2.js';

/**
 * Wraps raw Sui transaction bytes with the TransactionData intent prefix.
 *
 * Privy `raw_sign`: hex of intent message, `encoding: 'hex'`, `hash_function: 'blake2b256'`.
 *
 * @see https://docs.sui.io/develop/transactions/transaction-auth/intent-signing
 * @see https://docs.privy.io/recipes/use-tier-2#sui
 */
export function buildSuiTransactionIntentMessage(transactionBytes: Uint8Array): Uint8Array {
  return messageWithIntent('TransactionData', transactionBytes);
}

/** Hex-encoded intent message for Privy raw_sign (`encoding: 'hex'`). */
export function buildSuiTransactionIntentHex(transactionBytes: Uint8Array): string {
  return toHex(buildSuiTransactionIntentMessage(transactionBytes));
}

/** Blake2b-256 digest of the transaction intent message. */
export function buildSuiTransactionDigest(transactionBytes: Uint8Array): Uint8Array {
  return blake2b(buildSuiTransactionIntentMessage(transactionBytes), { dkLen: 32 });
}

export function buildSuiTransactionDigestHex(transactionBytes: Uint8Array): `0x${string}` {
  return `0x${toHex(buildSuiTransactionDigest(transactionBytes))}`;
}
