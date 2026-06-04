import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Buffer } from 'buffer';

export type ParsedSuiPrivateKey = {
  /** 32-byte seed as 64-char hex (no 0x prefix). */
  secretKeyHex: string;
  address: string;
};

function normalizeHexInput(input: string): string {
  const trimmed = input.trim();
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (hex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Invalid private key. Use a 64-character hex key or a Sui private key (suiprivkey…).');
  }
  return hex.toLowerCase();
}

/**
 * Parse a Sui Ed25519 private key (hex or `suiprivkey` bech32) and derive the Sui address.
 */
export function parseSuiPrivateKeyInput(input: string): ParsedSuiPrivateKey {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Enter your private key.');
  }

  let secretBytes: Uint8Array;

  if (trimmed.toLowerCase().startsWith('suiprivkey')) {
    const decoded = decodeSuiPrivateKey(trimmed);
    if (decoded.scheme !== 'ED25519') {
      throw new Error('Only Ed25519 Sui keys are supported.');
    }
    secretBytes = decoded.secretKey;
  } else {
    const hex = normalizeHexInput(trimmed);
    secretBytes = Uint8Array.from(Buffer.from(hex, 'hex'));
  }

  const keypair = Ed25519Keypair.fromSecretKey(secretBytes);

  return {
    secretKeyHex: Buffer.from(secretBytes).toString('hex'),
    address: keypair.getPublicKey().toSuiAddress(),
  };
}
