import { PREDICT_FLOAT_SCALING, PREDICT_QUANTITY_UNIT } from '~/constants/predict';
import { computeUpFairPrice, scaledAskToCents } from '~/lib/predict/trade-prices';
import type {
  MarketActivityRow,
  MarketHolderRow,
  MarketPositionRow,
  PredictOracleSviEvent,
  PredictOracleTrade,
  PredictPositionMintedEvent,
  PredictPositionRedeemedEvent,
} from '~/lib/predict/types';

const F = Number(PREDICT_FLOAT_SCALING);
const QUOTE_SCALE = 1_000_000;

type LedgerRow = {
  address: string;
  isUp: boolean;
  strike: number;
  openQuantity: number;
  totalCost: number;
};

function matchesOracleExpiry(
  row: { oracle_id: string; expiry: number },
  oracleId: string,
  expiry: number
): boolean {
  return row.oracle_id === oracleId && row.expiry === expiry;
}

function positionKey(address: string, strike: number, isUp: boolean, expiry: number): string {
  return `${address.toLowerCase()}-${strike}-${isUp ? 'up' : 'dn'}-${expiry}`;
}

function buildLedger(
  minted: PredictPositionMintedEvent[],
  redeemed: PredictPositionRedeemedEvent[],
  oracleId: string,
  expiry: number
): Map<string, LedgerRow> {
  const ledger = new Map<string, LedgerRow>();

  const ensure = (address: string, strike: number, isUp: boolean) => {
    const key = positionKey(address, strike, isUp, expiry);
    let row = ledger.get(key);
    if (!row) {
      row = { address, isUp, strike, openQuantity: 0, totalCost: 0 };
      ledger.set(key, row);
    }
    return row;
  };

  const sortedMints = [...minted]
    .filter((m) => matchesOracleExpiry(m, oracleId, expiry))
    .sort((a, b) => a.checkpoint_timestamp_ms - b.checkpoint_timestamp_ms);

  for (const mint of sortedMints) {
    const row = ensure(mint.trader, mint.strike, mint.is_up);
    row.openQuantity += mint.quantity;
    row.totalCost += mint.cost;
  }

  const sortedRedeems = [...redeemed]
    .filter((r) => matchesOracleExpiry(r, oracleId, expiry))
    .sort((a, b) => a.checkpoint_timestamp_ms - b.checkpoint_timestamp_ms);

  for (const redeem of sortedRedeems) {
    const row = ensure(redeem.owner, redeem.strike, redeem.is_up);
    row.openQuantity = Math.max(0, row.openQuantity - redeem.quantity);
    if (row.openQuantity === 0) {
      row.totalCost = 0;
    }
  }

  return ledger;
}

function markScaledForRow(
  row: LedgerRow,
  forward: number,
  svi: PredictOracleSviEvent | null,
  settlementPrice: number | null
): number {
  if (settlementPrice != null) {
    const upFair = settlementPrice > row.strike ? F : 0;
    return row.isUp ? upFair : F - upFair;
  }
  const upFair = svi ? computeUpFairPrice(row.strike, forward, svi) : null;
  const fair = upFair ?? Math.floor(F / 2);
  return row.isUp ? fair : F - fair;
}

export function buildMarketHolders(
  minted: PredictPositionMintedEvent[],
  redeemed: PredictPositionRedeemedEvent[],
  oracleId: string,
  expiry: number,
  limit = 10
): { up: MarketHolderRow[]; down: MarketHolderRow[] } {
  const ledger = buildLedger(minted, redeemed, oracleId, expiry);
  const upMap = new Map<string, number>();
  const downMap = new Map<string, number>();

  for (const row of ledger.values()) {
    if (row.openQuantity <= 0) continue;
    const shares = row.openQuantity / Number(PREDICT_QUANTITY_UNIT);
    const map = row.isUp ? upMap : downMap;
    map.set(row.address, (map.get(row.address) ?? 0) + shares);
  }

  const toRows = (map: Map<string, number>): MarketHolderRow[] =>
    [...map.entries()]
      .map(([address, shares]) => ({
        address,
        shares: Math.round(shares * 100) / 100,
      }))
      .sort((a, b) => b.shares - a.shares)
      .slice(0, limit);

  return { up: toRows(upMap), down: toRows(downMap) };
}

export function buildMarketPositions(
  minted: PredictPositionMintedEvent[],
  redeemed: PredictPositionRedeemedEvent[],
  oracleId: string,
  expiry: number,
  forward: number,
  svi: PredictOracleSviEvent | null,
  settlementPrice: number | null
): { up: MarketPositionRow[]; down: MarketPositionRow[] } {
  const ledger = buildLedger(minted, redeemed, oracleId, expiry);
  const upAgg = new Map<
    string,
    { openQuantity: number; totalCost: number; markValueUsd: number }
  >();
  const downAgg = new Map<
    string,
    { openQuantity: number; totalCost: number; markValueUsd: number }
  >();

  for (const row of ledger.values()) {
    if (row.openQuantity <= 0) continue;
    const map = row.isUp ? upAgg : downAgg;
    const prev = map.get(row.address) ?? {
      openQuantity: 0,
      totalCost: 0,
      markValueUsd: 0,
    };
    const markScaled = markScaledForRow(row, forward, svi, settlementPrice);
    const markValueUsd = (row.openQuantity * markScaled) / F / QUOTE_SCALE;
    map.set(row.address, {
      openQuantity: prev.openQuantity + row.openQuantity,
      totalCost: prev.totalCost + row.totalCost,
      markValueUsd: prev.markValueUsd + markValueUsd,
    });
  }

  const toRows = (
    map: Map<string, { openQuantity: number; totalCost: number; markValueUsd: number }>,
    isUp: boolean
  ): MarketPositionRow[] =>
    [...map.entries()]
      .map(([address, agg]) => {
        const avgEntryScaled =
          agg.openQuantity > 0
            ? Math.floor((agg.totalCost * F) / agg.openQuantity)
            : 0;
        return {
          address,
          isUp,
          avgEntryCents: scaledAskToCents(avgEntryScaled),
          pnlUsd: agg.markValueUsd - agg.totalCost / QUOTE_SCALE,
          openQuantity: agg.openQuantity,
        };
      })
      .sort((a, b) => b.pnlUsd - a.pnlUsd);

  return { up: toRows(upAgg, true), down: toRows(downAgg, false) };
}

export function buildMarketActivity(
  trades: PredictOracleTrade[],
  oracleId: string,
  expiry: number,
  limit = 40
): MarketActivityRow[] {
  return trades
    .filter((t) => matchesOracleExpiry(t, oracleId, expiry))
    .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
    .slice(0, limit)
    .map((trade) => {
      const address = trade.trader ?? trade.owner ?? trade.sender;
      const priceScaled = trade.type === 'mint' ? trade.ask_price : trade.bid_price;
      const priceCents = priceScaled != null ? scaledAskToCents(priceScaled) : 0;
      const totalRaw = trade.type === 'mint' ? (trade.cost ?? 0) : (trade.payout ?? 0);

      return {
        id: trade.event_digest,
        address,
        side: trade.is_up ? 'up' : 'down',
        action: trade.type === 'mint' ? 'bought' : 'sold',
        quantity: trade.quantity / Number(PREDICT_QUANTITY_UNIT),
        priceCents,
        totalUsd: totalRaw / QUOTE_SCALE,
        timestampMs: trade.checkpoint_timestamp_ms,
        digest: trade.digest,
      } satisfies MarketActivityRow;
    });
}

export function resolveMarkUpScaled(
  strike: number,
  forward: number,
  svi: PredictOracleSviEvent | null,
  settlementPrice: number | null
): number | null {
  if (settlementPrice != null) {
    return settlementPrice > strike ? F : 0;
  }
  if (!svi) return null;
  return computeUpFairPrice(strike, forward, svi);
}

/** Client-side filter when indexed oracle query returns nothing. */
export function filterMintedByOracle(
  rows: PredictPositionMintedEvent[],
  oracleId: string
): PredictPositionMintedEvent[] {
  return rows.filter((r) => r.oracle_id === oracleId);
}

export function filterRedeemedByOracle(
  rows: PredictPositionRedeemedEvent[],
  oracleId: string
): PredictPositionRedeemedEvent[] {
  return rows.filter((r) => r.oracle_id === oracleId);
}
