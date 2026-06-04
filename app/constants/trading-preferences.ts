/** Defaults & toggles for Hedge prediction (UP / DOWN / Range on Play). */

/** When false, stake presets are hidden in settings; bet modal still uses defaultStakeUsd. */
export const DEFAULT_STAKE_SELECTION_ENABLED = true;

/** Stakes at or above this trigger an extra confirmation when risk warnings are on. */
export const HIGH_STAKE_RISK_USD = 50;

export const DEFAULT_STAKE_USD_OPTIONS = [5, 10, 25, 50, 100] as const;
export type DefaultStakeUsd = (typeof DEFAULT_STAKE_USD_OPTIONS)[number];

export const DEFAULT_EXPIRY_OPTIONS = [
  { id: '5m', minutes: 5 },
  { id: '15m', minutes: 15 },
  { id: '30m', minutes: 30 },
  { id: '1h', minutes: 60 },
] as const;

export type DefaultExpiryId = (typeof DEFAULT_EXPIRY_OPTIONS)[number]['id'];

export type TradingPreferencesState = {
  /** Default DUSDC stake when swiping a prediction card. */
  defaultStakeUsd: DefaultStakeUsd;
  /** Default sub-hour expiry preset on new cards. */
  defaultExpiryId: DefaultExpiryId;
  /** Skip the review sheet before signing the mint PTB. */
  skipBetConfirmation: boolean;
  /** Light haptic on swipe commit (UP / DOWN / Range). */
  hapticsOnSwipe: boolean;
  /** Show fair SVI odds on prediction cards. */
  showOddsOnCard: boolean;
  /** Hide unrealized PnL on Positions and Portfolio. */
  hidePnl: boolean;
  /** Show risk copy before high-stake or out-of-range bets. */
  showRiskWarnings: boolean;
  /** Push when the Keeper auto-redeems at expiry. */
  notifyOnSettlement: boolean;
};

export const DEFAULT_TRADING_PREFERENCES: TradingPreferencesState = {
  defaultStakeUsd: 10,
  defaultExpiryId: '15m',
  skipBetConfirmation: false,
  hapticsOnSwipe: true,
  showOddsOnCard: true,
  hidePnl: false,
  showRiskWarnings: true,
  notifyOnSettlement: true,
};

export function isDefaultStakeUsd(value: number): value is DefaultStakeUsd {
  return (DEFAULT_STAKE_USD_OPTIONS as readonly number[]).includes(value);
}

export function isDefaultExpiryId(value: string): value is DefaultExpiryId {
  return DEFAULT_EXPIRY_OPTIONS.some((option) => option.id === value);
}

export function getExpiryOption(id: DefaultExpiryId) {
  return DEFAULT_EXPIRY_OPTIONS.find((option) => option.id === id)!;
}
