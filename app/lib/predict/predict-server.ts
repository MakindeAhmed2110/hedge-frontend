import { PREDICT_OBJECT_ID, PREDICT_SERVER_URL } from '~/constants/predict';
import { mapWithConcurrency } from '~/lib/predict/fetch-pool';
import {
  getCachedOracleCatalog,
  getCachedOracleState,
  setCachedOracleCatalog,
  setCachedOracleState,
} from '~/lib/predict/predict-play-cache';
import { sortActiveOracles } from '~/lib/predict/oracle-catalog';
import type {
  PredictManagerListItem,
  PredictManagerSummary,
  PredictOracleListItem,
  PredictOracleStateResponse,
  PredictOracleTrade,
  PredictPositionMintedEvent,
  PredictPositionRedeemedEvent,
  PredictPositionSummary,
  PredictVaultPerformance,
  PredictVaultSummary,
} from '~/lib/predict/types';

const PREDICT_FETCH_TIMEOUT_MS = 12_000;
const ORACLE_STATE_CONCURRENCY = 6;

async function predictFetch<T>(path: string): Promise<T> {
  const url = `${PREDICT_SERVER_URL.replace(/\/$/, '')}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PREDICT_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(body || `Predict server error (${response.status})`);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Predict server timed out (${path})`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPredictOracles(
  predictId = PREDICT_OBJECT_ID
): Promise<PredictOracleListItem[]> {
  return predictFetch<PredictOracleListItem[]>(`/predicts/${predictId}/oracles`);
}

export async function fetchOracleState(oracleId: string): Promise<PredictOracleStateResponse> {
  const cached = getCachedOracleState(oracleId);
  if (cached) return cached;

  const state = await predictFetch<PredictOracleStateResponse>(`/oracles/${oracleId}/state`);
  setCachedOracleState(oracleId, state);
  return state;
}

export async function fetchOracleCatalogCached(): Promise<PredictOracleListItem[]> {
  const cached = getCachedOracleCatalog();
  if (cached) return cached;

  const catalog = await fetchOracleCatalog();
  setCachedOracleCatalog(catalog);
  return catalog;
}

function fallbackOracleState(oracle: PredictOracleListItem): PredictOracleStateResponse {
  return {
    oracle,
    latest_price: null,
    latest_svi: null,
    ask_bounds: null,
  };
}

export async function fetchOracleStatesForOracles(
  oracles: PredictOracleListItem[],
  concurrency = ORACLE_STATE_CONCURRENCY
): Promise<PredictOracleStateResponse[]> {
  return mapWithConcurrency(
    oracles,
    async (oracle) => {
      try {
        return await fetchOracleState(oracle.oracle_id);
      } catch {
        return fallbackOracleState(oracle);
      }
    },
    concurrency
  );
}

export async function fetchPredictManagers(): Promise<PredictManagerListItem[]> {
  return predictFetch<PredictManagerListItem[]>('/managers');
}

export async function findManagerForOwner(owner: string): Promise<PredictManagerListItem | null> {
  const normalized = owner.toLowerCase();
  const managers = await fetchPredictManagers();
  return managers.find((item) => item.owner.toLowerCase() === normalized) ?? null;
}

export async function fetchManagerSummary(managerId: string): Promise<PredictManagerSummary> {
  return predictFetch<PredictManagerSummary>(`/managers/${managerId}/summary`);
}

export async function fetchManagerPositionsSummary(
  managerId: string
): Promise<PredictPositionSummary[]> {
  return predictFetch<PredictPositionSummary[]>(`/managers/${managerId}/positions/summary`);
}

/** All oracles from predict-server (active, settled, etc.). */
export async function fetchOracleCatalog(): Promise<PredictOracleListItem[]> {
  const data = await fetchPredictOracles();
  setCachedOracleCatalog(data);
  return data;
}

export async function fetchActivePlayOracles(): Promise<PredictOracleListItem[]> {
  const all = await fetchPredictOracles();
  return sortActiveOracles(all);
}

export async function fetchVaultSummary(
  predictId = PREDICT_OBJECT_ID
): Promise<PredictVaultSummary> {
  return predictFetch<PredictVaultSummary>(`/predicts/${predictId}/vault/summary`);
}

export async function fetchVaultPerformance(
  predictId = PREDICT_OBJECT_ID,
  range: 'ALL' | '1D' | '7D' | '30D' = 'ALL'
): Promise<PredictVaultPerformance> {
  return predictFetch<PredictVaultPerformance>(
    `/predicts/${predictId}/vault/performance?range=${range}`
  );
}

export async function fetchOracleTrades(
  oracleId: string,
  limit = 50
): Promise<PredictOracleTrade[]> {
  return predictFetch<PredictOracleTrade[]>(`/trades/${oracleId}?limit=${limit}`);
}

export async function fetchPositionsMinted(
  oracleId?: string,
  limit = 300
): Promise<PredictPositionMintedEvent[]> {
  const query = oracleId
    ? `oracle_id=${encodeURIComponent(oracleId)}&limit=${limit}`
    : `limit=${limit}`;
  return predictFetch<PredictPositionMintedEvent[]>(`/positions/minted?${query}`);
}

export async function fetchPositionsRedeemed(
  oracleId?: string,
  limit = 300
): Promise<PredictPositionRedeemedEvent[]> {
  const query = oracleId
    ? `oracle_id=${encodeURIComponent(oracleId)}&limit=${limit}`
    : `limit=${limit}`;
  return predictFetch<PredictPositionRedeemedEvent[]>(`/positions/redeemed?${query}`);
}
