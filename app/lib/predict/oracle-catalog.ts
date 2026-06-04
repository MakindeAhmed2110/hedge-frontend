import type { PredictOracleListItem } from '~/lib/predict/types';

export type OracleCatalogSummary = {
  total: number;
  active: number;
  settled: number;
  activeAssets: string[];
};

export function summarizeOracleCatalog(
  oracles: PredictOracleListItem[],
  nowMs = Date.now()
): OracleCatalogSummary {
  const active = oracles.filter(
    (oracle) => oracle.status === 'active' && oracle.expiry > nowMs
  );
  const activeAssets = [
    ...new Set(active.map((oracle) => oracle.underlying_asset.toUpperCase())),
  ].sort();

  return {
    total: oracles.length,
    active: active.length,
    settled: oracles.filter((oracle) => oracle.status === 'settled').length,
    activeAssets,
  };
}

export function sortActiveOracles(
  oracles: PredictOracleListItem[],
  nowMs = Date.now()
): PredictOracleListItem[] {
  return oracles
    .filter((oracle) => oracle.status === 'active' && oracle.expiry > nowMs)
    .sort((a, b) => a.expiry - b.expiry);
}
