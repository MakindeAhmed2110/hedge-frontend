import type { PredictOracleListItem, PredictOracleStateResponse } from "~/lib/predict/types";

const CATALOG_TTL_MS = 45_000;
const STATE_TTL_MS = 20_000;

let catalogEntry: { at: number; data: PredictOracleListItem[] } | null = null;
const stateEntries = new Map<string, { at: number; data: PredictOracleStateResponse }>();

export function getCachedOracleCatalog(now = Date.now()): PredictOracleListItem[] | null {
  if (!catalogEntry || now - catalogEntry.at > CATALOG_TTL_MS) return null;
  return catalogEntry.data;
}

export function setCachedOracleCatalog(data: PredictOracleListItem[], now = Date.now()) {
  catalogEntry = { at: now, data };
}

export function getCachedOracleState(
  oracleId: string,
  now = Date.now()
): PredictOracleStateResponse | null {
  const entry = stateEntries.get(oracleId);
  if (!entry || now - entry.at > STATE_TTL_MS) return null;
  return entry.data;
}

export function setCachedOracleState(
  oracleId: string,
  data: PredictOracleStateResponse,
  now = Date.now()
) {
  stateEntries.set(oracleId, { at: now, data });
}

export function clearPredictPlayCache() {
  catalogEntry = null;
  stateEntries.clear();
}
