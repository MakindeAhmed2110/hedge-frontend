export type OracleLifecycleStatus = 'inactive' | 'active' | 'pending_settlement' | 'settled';

export type PredictOracleListItem = {
  predict_id: string;
  oracle_id: string;
  oracle_cap_id: string;
  underlying_asset: string;
  expiry: number;
  min_strike: number;
  tick_size: number;
  status: OracleLifecycleStatus;
  activated_at: number | null;
  settlement_price: number | null;
  settled_at: number | null;
  created_checkpoint: number;
};

export type PredictOraclePriceEvent = {
  oracle_id: string;
  spot: number;
  forward: number;
  onchain_timestamp: number;
  checkpoint_timestamp_ms?: number;
};

export type PredictOracleSviEvent = {
  oracle_id: string;
  a: number;
  b: number;
  rho: number;
  rho_negative: boolean;
  m: number;
  m_negative: boolean;
  sigma: number;
  onchain_timestamp: number;
};

export type PredictOracleStateResponse = {
  oracle: PredictOracleListItem;
  latest_price: PredictOraclePriceEvent | null;
  latest_svi: PredictOracleSviEvent | null;
  ask_bounds: { min_ask: number; max_ask: number } | null;
};

export type PredictManagerListItem = {
  manager_id: string;
  owner: string;
  checkpoint_timestamp_ms: number;
  digest?: string;
  sender?: string;
  checkpoint?: number;
};

export type PredictManagerSummary = {
  manager_id: string;
  owner: string;
  balances: { quote_asset: string; balance: number }[];
  trading_balance: number;
  open_exposure: number;
  redeemable_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  account_value: number;
  open_positions: number;
  awaiting_settlement_positions: number;
};

export type PredictPositionStatus = 'active' | 'redeemed' | 'awaiting_settlement' | string;

export type PredictPositionSummary = {
  predict_id: string;
  manager_id: string;
  quote_asset: string;
  oracle_id: string;
  underlying_asset: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  minted_quantity: number;
  redeemed_quantity: number;
  open_quantity: number;
  total_cost: number;
  total_payout: number;
  realized_pnl: number;
  unrealized_pnl: number;
  open_cost_basis: number;
  average_entry_price: number | null;
  average_exit_price: number | null;
  mark_price: number | null;
  mark_value: number | null;
  status: PredictPositionStatus;
  first_minted_at: number;
  last_activity_at: number;
};

/** Card-ready oracle with live price + ATM strike. */
export type PredictPlayCard = {
  oracle: PredictOracleListItem;
  spot: number;
  forward: number;
  atmStrike: bigint;
  priceUpdatedAt: number;
};

export type PredictVaultSummary = {
  predict_id: string;
  quote_assets: string[];
  vault_balance: number;
  vault_value: number;
  total_mtm: number;
  total_max_payout: number;
  available_liquidity: number;
  available_withdrawal: number;
  plp_total_supply: number;
  plp_share_price: number;
  utilization: number;
  max_payout_utilization: number;
  net_deposits: number;
  total_supplied: number;
  total_withdrawn: number;
};

export type PredictVaultPerformancePoint = {
  timestamp_ms: number;
  share_price: number;
  vault_value: number;
};

export type PredictVaultPerformance = {
  predict_id: string;
  range: string;
  points: PredictVaultPerformancePoint[];
};

/** Indexed `PositionMinted` event from predict-server. */
export type PredictPositionMintedEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  predict_id: string;
  manager_id: string;
  trader: string;
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number;
  cost: number;
  ask_price: number;
};

/** Indexed `PositionRedeemed` event from predict-server. */
export type PredictPositionRedeemedEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  predict_id: string;
  manager_id: string;
  owner: string;
  executor: string;
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number;
  payout: number;
  bid_price: number;
  is_settled: boolean;
};

/** Normalized trade row from `GET /trades/:oracle_id`. */
export type PredictOracleTrade = {
  type: 'mint' | 'redeem';
  event_digest: string;
  digest: string;
  checkpoint_timestamp_ms: number;
  trader?: string;
  owner?: string;
  sender: string;
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number;
  cost?: number;
  payout?: number;
  ask_price?: number;
  bid_price?: number;
};

export type MarketHolderRow = {
  address: string;
  shares: number;
};

export type MarketPositionRow = {
  address: string;
  isUp: boolean;
  avgEntryCents: number;
  pnlUsd: number;
  openQuantity: number;
};

export type MarketActivityRow = {
  id: string;
  address: string;
  side: 'up' | 'down';
  action: 'bought' | 'sold';
  quantity: number;
  priceCents: number;
  totalUsd: number;
  timestampMs: number;
  digest: string;
};
