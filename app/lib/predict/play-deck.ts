import type { PredictPlayCard } from '~/lib/predict/types';

/** Merge server cards into the local deck without re-adding dismissed oracles. */
export function mergePlayDeck(
  fetched: PredictPlayCard[],
  prev: PredictPlayCard[],
  dismissedOracleIds: ReadonlySet<string>
): PredictPlayCard[] {
  const active = fetched.filter((card) => !dismissedOracleIds.has(card.oracle.oracle_id));
  if (prev.length === 0) {
    return active;
  }

  const fetchedById = new Map(active.map((card) => [card.oracle.oracle_id, card]));
  const kept = prev
    .filter((card) => fetchedById.has(card.oracle.oracle_id))
    .map((card) => fetchedById.get(card.oracle.oracle_id)!);
  const keptIds = new Set(kept.map((card) => card.oracle.oracle_id));
  const novel = active.filter((card) => !keptIds.has(card.oracle.oracle_id));
  return [...kept, ...novel];
}
