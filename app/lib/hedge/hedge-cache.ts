type Listener = () => void;

const pointsListeners = new Set<Listener>();

export function subscribeHedgePointsInvalidate(listener: Listener): () => void {
  pointsListeners.add(listener);
  return () => pointsListeners.delete(listener);
}

/** Call after a successful predict mint — points arrive via backend indexer. */
export function invalidateHedgePoints(): void {
  for (const listener of pointsListeners) {
    listener();
  }
}
