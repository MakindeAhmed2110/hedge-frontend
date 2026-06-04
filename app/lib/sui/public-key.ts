import { fromBase58, fromBase64, fromHex, normalizeSuiAddress } from '@mysten/sui/utils';
import { publicKeyFromRawBytes } from '@mysten/sui/verify';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

const ED25519_FLAG = 0;

/** Sui stores Ed25519 keys as `flag (1 byte) || 32-byte public key`. */
function rawEd25519Bytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) {
    return bytes;
  }
  if (bytes.length === 33 && bytes[0] === ED25519_FLAG) {
    return bytes.subarray(1);
  }
  throw new Error(
    `Invalid public key length: expected 32 raw bytes or 33 Sui-serialized bytes, got ${bytes.length}`
  );
}

function looksLikeBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
}

function looksLikeHex(value: string): boolean {
  return /^(0x)?[0-9a-fA-F]+$/.test(value);
}

/**
 * Decode a Privy Sui wallet public key per Sui docs (base58 raw Ed25519, with base64/hex fallbacks).
 * @see https://docs.sui.io/develop/transactions/transaction-auth/intent-signing
 * @see https://docs.privy.io/recipes/use-tier-2
 */
export function ed25519PublicKeyFromPrivy(
  publicKey: string,
  expectedAddress?: string
): Ed25519PublicKey {
  const trimmed = publicKey.trim();
  const options = expectedAddress
    ? { address: normalizeSuiAddress(expectedAddress) }
    : undefined;

  let rawBytes: Uint8Array;

  if (looksLikeBase64(trimmed)) {
    rawBytes = rawEd25519Bytes(fromBase64(trimmed));
  } else if (looksLikeHex(trimmed)) {
    const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
    rawBytes = rawEd25519Bytes(fromHex(hex));
  } else {
    rawBytes = rawEd25519Bytes(fromBase58(trimmed));
  }

  return publicKeyFromRawBytes('ED25519', rawBytes, options) as Ed25519PublicKey;
}
