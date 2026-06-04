/**
 * HPKE encryption for Privy wallet import (P-256 + HKDF-SHA256 + ChaCha20-Poly1305).
 */
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { p256 } from '@noble/curves/nist.js';
import { extract as hkdfExtract, expand as hkdfExpand } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { Buffer } from 'buffer';

export class HPKEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HPKEError';
  }
}

const N_SECRET = 32;
const N_K = 32;
const N_N = 12;

const SUITE_ID = new Uint8Array([
  0x48, 0x50, 0x4b, 0x45,
  0x00, 0x10,
  0x00, 0x01,
  0x00, 0x03,
]);

const KEM_SUITE_ID = new Uint8Array([0x4b, 0x45, 0x4d, 0x00, 0x10]);

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function i2osp(value: number, length: number): Uint8Array {
  const result = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    result[i] = value & 0xff;
    value = value >>> 8;
  }
  return result;
}

function labeledExtract(
  salt: Uint8Array,
  label: string,
  ikm: Uint8Array,
  suiteId: Uint8Array
): Uint8Array {
  const labelBytes = new TextEncoder().encode(label);
  const labeledIkm = concatBytes(
    new TextEncoder().encode('HPKE-v1'),
    suiteId,
    labelBytes,
    ikm
  );
  return hkdfExtract(sha256, labeledIkm, salt.length > 0 ? salt : undefined);
}

function labeledExpand(
  prk: Uint8Array,
  label: string,
  info: Uint8Array,
  length: number,
  suiteId: Uint8Array
): Uint8Array {
  const labelBytes = new TextEncoder().encode(label);
  const labeledInfo = concatBytes(
    i2osp(length, 2),
    new TextEncoder().encode('HPKE-v1'),
    suiteId,
    labelBytes,
    info
  );
  return hkdfExpand(sha256, prk, labeledInfo, length);
}

function extractAndExpand(dh: Uint8Array, kemContext: Uint8Array): Uint8Array {
  const eaePrk = labeledExtract(new Uint8Array(0), 'eae_prk', dh, KEM_SUITE_ID);
  return labeledExpand(eaePrk, 'shared_secret', kemContext, N_SECRET, KEM_SUITE_ID);
}

export async function encryptPrivateKeyForPrivy(
  recipientPublicKeyBase64: string,
  privateKeyHex: string
): Promise<{ ciphertext: string; encapsulated_key: string }> {
  const hex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;

  if (hex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new HPKEError('Invalid private key format. Expected 64 hex characters.');
  }

  const plaintext = Buffer.from(hex, 'hex');
  const pkRBytes = Buffer.from(recipientPublicKeyBase64, 'base64');

  const { secretKey: skE } = p256.keygen();
  const pkE = p256.getPublicKey(skE, false);

  const sharedSecret = p256.getSharedSecret(skE, pkRBytes, false);
  const dh = sharedSecret.slice(1, 33);
  const kemContext = concatBytes(pkE, new Uint8Array(pkRBytes));
  const hpkeSharedSecret = extractAndExpand(dh, kemContext);

  const pskIdHash = labeledExtract(new Uint8Array(0), 'psk_id_hash', new Uint8Array(0), SUITE_ID);
  const infoHash = labeledExtract(new Uint8Array(0), 'info_hash', new Uint8Array(0), SUITE_ID);
  const ksContext = concatBytes(new Uint8Array([0x00]), pskIdHash, infoHash);

  const secret = labeledExtract(hpkeSharedSecret, 'secret', new Uint8Array(0), SUITE_ID);
  const key = labeledExpand(secret, 'key', ksContext, N_K, SUITE_ID);
  const baseNonce = labeledExpand(secret, 'base_nonce', ksContext, N_N, SUITE_ID);

  const cipher = chacha20poly1305(key, baseNonce);
  const ciphertextBytes = cipher.encrypt(new Uint8Array(plaintext));

  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    encapsulated_key: Buffer.from(pkE).toString('base64'),
  };
}
