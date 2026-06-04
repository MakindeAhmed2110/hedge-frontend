/** DeepBook Predict testnet — see deepbook/packages/predict/README.md */

export const PREDICT_SERVER_URL =
  import.meta.env.VITE_PREDICT_SERVER_URL?.trim() ||
  'https://predict-server.testnet.mystenlabs.com';

export const PREDICT_PACKAGE_ID =
  '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138';

export const PREDICT_OBJECT_ID =
  '0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a';

export const PREDICT_CLOCK_OBJECT_ID = '0x6';

/** On-chain price/strike scaling (1e9). */
export const PREDICT_FLOAT_SCALING = 1_000_000_000n;

/** Max gas (MIST) reserved for Predict txs — must be covered by wallet SUI at sign time. */
export const PREDICT_GAS_BUDGET = 150_000_000n;

/** Default contract quantity scale (matches common testnet mints). */
export const PREDICT_QUANTITY_UNIT = 1_000_000n;

/** Fallback when no stake is passed (should not happen on Play). */
export const FIXED_MINT_DEPOSIT_RAW = 1_000_000n;
export const FIXED_MINT_QUANTITY = PREDICT_QUANTITY_UNIT;

/** Per-bet DUSDC limits on Play. */
export const MIN_BET_USD = 0.1;
export const MAX_BET_USD = 10_000;

export const BET_AMOUNT_QUICK_USD = [0.1, 1, 5, 10, 25, 50, 100] as const;
