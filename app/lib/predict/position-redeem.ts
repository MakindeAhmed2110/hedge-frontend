import type { PredictPositionSummary } from '~/lib/predict/types';

/** On-chain quantity for a full close (matches predict-server summary fields). */
export function positionOpenQuantityRaw(position: PredictPositionSummary): bigint {
  const raw = Math.round(position.open_quantity);
  if (raw <= 0) {
    throw new Error('Position has no open quantity to close.');
  }
  return BigInt(raw);
}

export function positionStrikeRaw(position: PredictPositionSummary): bigint {
  return BigInt(Math.round(position.strike));
}

/** Estimated DUSDC returned to the manager (server mark; not a chain quote). */
export function estimateClosePayoutUsd(position: PredictPositionSummary): number | null {
  if (position.mark_value != null && Number.isFinite(position.mark_value)) {
    return position.mark_value;
  }
  if (
    position.mark_price != null &&
    Number.isFinite(position.mark_price) &&
    position.open_quantity > 0
  ) {
    return (position.mark_price * position.open_quantity) / 1_000_000_000;
  }
  return null;
}
