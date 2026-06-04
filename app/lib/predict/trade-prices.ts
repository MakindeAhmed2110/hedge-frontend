import { PREDICT_FLOAT_SCALING } from '~/constants/predict';
import type { PredictOracleSviEvent, PredictVaultSummary } from '~/lib/predict/types';

const F = Number(PREDICT_FLOAT_SCALING);

/** Mirrors `deepbook_predict::constants` defaults when server pricing is null. */
const DEFAULT_BASE_SPREAD = 20_000_000;
const DEFAULT_MIN_SPREAD = 5_000_000;
const DEFAULT_UTILIZATION_MULTIPLIER = 2_000_000_000;

export type DirectionalMintQuotes = {
  upAskScaled: number;
  downAskScaled: number;
  upAskCents: number;
  downAskCents: number;
  upFairScaled: number;
};

function mul(a: number, b: number): number {
  return Math.floor((a * b) / F);
}

function div(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.floor((a * F) / b);
}

function sqrtFixed(x: number, precision: number): number {
  if (x <= 0) return 0;
  const multiplier = F / precision;
  const scaled = x * multiplier * F;
  return Math.floor(Math.sqrt(scaled) / multiplier);
}

function signedParam(magnitude: number, negative: boolean): number {
  const v = magnitude / F;
  return negative ? -v : v;
}

/** Standard normal CDF Φ(x), returned in FLOAT_SCALING (1e9). */
function normalCdfFloat(x: number): number {
  if (x > 8) return F;
  if (x < -8) return 0;
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    1 -
    d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const phi = x < 0 ? 1 - prob : prob;
  return Math.max(0, Math.min(F, Math.round(phi * F)));
}

/**
 * `oracle::compute_nd2` — conditional UP probability from SVI (scaled 1e9).
 */
export function computeUpFairPrice(
  strike: number,
  forward: number,
  svi: PredictOracleSviEvent
): number | null {
  if (forward <= 0 || strike <= 0) return null;

  const k = Math.log(strike / forward);
  const m = signedParam(svi.m, svi.m_negative);
  const rho = signedParam(svi.rho, svi.rho_negative);
  const sigma = svi.sigma / F;
  const a = svi.a / F;
  const b = svi.b / F;

  const km = k - m;
  const inner = rho * km + Math.sqrt(km * km + sigma * sigma);
  if (inner < 0) return null;

  const totalVar = a + b * inner;
  if (totalVar <= 0) return null;

  const d2 = -((k + totalVar / 2) / Math.sqrt(totalVar));
  return normalCdfFloat(d2);
}

/** Mirrors `pricing_config::quote_spread_from_fair_price`. */
export function quoteSpreadFromFairPrice(
  fairPrice: number,
  liability: number,
  balance: number
): number {
  if (fairPrice <= 0 || fairPrice >= F) return 0;

  const complement = F - fairPrice;
  const variance = mul(fairPrice, complement);
  const bernoulliFactor = sqrtFixed(variance, F);
  let spread = Math.max(mul(DEFAULT_BASE_SPREAD, bernoulliFactor), DEFAULT_MIN_SPREAD);

  if (balance > 0 && liability > 0) {
    const util = liability >= balance ? F : div(liability, balance);
    const utilSq = mul(util, util);
    spread += mul(DEFAULT_BASE_SPREAD, mul(DEFAULT_UTILIZATION_MULTIPLIER, utilSq));
  }

  return spread;
}

/**
 * Mirrors `predict::trade_prices` for ATM directional mint asks.
 */
export function computeDirectionalMintQuotes({
  strike,
  forward,
  svi,
  vault,
  settlementPrice,
}: {
  strike: number;
  forward: number;
  svi: PredictOracleSviEvent | null;
  vault: Pick<PredictVaultSummary, 'total_mtm' | 'vault_balance'> | null;
  settlementPrice?: number | null;
}): DirectionalMintQuotes | null {
  let upPrice: number;

  if (settlementPrice != null) {
    upPrice = settlementPrice > strike ? F : 0;
  } else {
    if (!svi) return null;
    const fair = computeUpFairPrice(strike, forward, svi);
    if (fair == null) return null;
    upPrice = fair;
  }

  const liability = vault?.total_mtm ?? 0;
  const balance = vault?.vault_balance ?? 0;
  const spread = quoteSpreadFromFairPrice(upPrice, liability, balance);

  const upBid = upPrice > spread ? upPrice - spread : 0;
  const upAsk = Math.min(upPrice + spread, F);
  const dnAsk = F - upBid;

  return {
    upFairScaled: upPrice,
    upAskScaled: upAsk,
    downAskScaled: dnAsk,
    upAskCents: scaledAskToCents(upAsk),
    downAskCents: scaledAskToCents(dnAsk),
  };
}

export function scaledAskToCents(askScaled: number): number {
  const cents = Math.round((askScaled / F) * 100);
  return Math.max(1, Math.min(99, cents));
}
