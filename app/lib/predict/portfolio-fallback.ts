import type { PredictManagerSummary, PredictPositionSummary } from '~/lib/predict/types';

export function isMarkQuotePortfolioError(message: string): boolean {
  return /missing mark quote/i.test(message);
}

/** When predict-server summary fails (e.g. expired oracle), derive totals from position rows. */
export function deriveManagerSummaryFromPositions(
  positions: PredictPositionSummary[],
  managerId: string
): PredictManagerSummary {
  const open = positions.filter((p) => p.open_quantity > 0);
  const unrealized = open.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0);
  const realized = positions.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0);
  const markValue = open.reduce((sum, p) => sum + (p.mark_value ?? 0), 0);

  return {
    manager_id: managerId,
    owner: '',
    balances: [],
    trading_balance: 0,
    open_exposure: 0,
    redeemable_value: markValue,
    realized_pnl: realized,
    unrealized_pnl: unrealized,
    account_value: markValue,
    open_positions: open.length,
    awaiting_settlement_positions: open.filter((p) => p.status === 'awaiting_settlement')
      .length,
  };
}
