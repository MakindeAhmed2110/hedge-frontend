import type { PredictPositionSummary } from '~/lib/predict/types';

export function positionAlertKey(
  position: Pick<PredictPositionSummary, 'oracle_id' | 'strike' | 'is_up'>
): string {
  return `${position.oracle_id}-${position.strike}-${position.is_up}`;
}

export function isMarketExpired(position: PredictPositionSummary, nowMs = Date.now()): boolean {
  return position.expiry <= nowMs;
}

/** Position is effectively worthless (typical 100% premium loss). */
export function isWorthlessPosition(position: PredictPositionSummary): boolean {
  if (position.open_quantity <= 0) {
    return false;
  }

  const markValue = position.mark_value ?? 0;
  const cost = position.open_cost_basis;
  if (markValue <= 0) {
    return true;
  }

  if (cost > 0 && position.unrealized_pnl <= -cost * 0.9) {
    return true;
  }

  return false;
}

export function isAwaitingSettlement(position: PredictPositionSummary): boolean {
  return position.status === 'awaiting_settlement';
}

/** Still on-chain with open qty but should not appear in the main Open list. */
export function isExpiredPendingClear(
  position: PredictPositionSummary,
  nowMs = Date.now()
): boolean {
  if (position.open_quantity <= 0) {
    return false;
  }
  if (position.status === 'redeemed') {
    return false;
  }
  if (isAwaitingSettlement(position)) {
    return true;
  }
  return isMarketExpired(position, nowMs) && isWorthlessPosition(position);
}

export function isActiveOpenPosition(
  position: PredictPositionSummary,
  nowMs = Date.now()
): boolean {
  if (position.open_quantity <= 0) {
    return false;
  }
  if (position.status === 'redeemed') {
    return false;
  }
  return !isExpiredPendingClear(position, nowMs);
}

export function partitionOpenPositions(positions: PredictPositionSummary[], nowMs = Date.now()) {
  const active: PredictPositionSummary[] = [];
  const expiredPendingClear: PredictPositionSummary[] = [];

  for (const position of positions) {
    if (position.open_quantity <= 0) {
      continue;
    }
    if (isExpiredPendingClear(position, nowMs)) {
      expiredPendingClear.push(position);
    } else if (isActiveOpenPosition(position, nowMs)) {
      active.push(position);
    }
  }

  return { active, expiredPendingClear };
}
