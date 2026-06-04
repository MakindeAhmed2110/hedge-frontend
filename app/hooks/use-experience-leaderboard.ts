import { useCallback, useEffect, useRef, useState } from "react";

import { fetchExperienceLeaderboard } from "~/lib/leaderboard/fetch-leaderboard";
import type { LeaderboardUser } from "~/lib/leaderboard/types";

const STALE_MS = 2 * 60_000;

let cachedUsers: LeaderboardUser[] | null = null;
let cachedAt = 0;

export function useExperienceLeaderboard(limit = 100) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);

      const now = Date.now();
      if (!silent && cachedUsers && now - cachedAt < STALE_MS) {
        setUsers(cachedUsers);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const items = await fetchExperienceLeaderboard(limit);
        if (!mountedRef.current) return;
        cachedUsers = items;
        cachedAt = Date.now();
        setUsers(items);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [limit]
  );

  const refetch = useCallback(() => {
    setIsRefreshing(true);
    cachedUsers = null;
    void load(true);
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    void load(false);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { users, isLoading, isRefreshing, error, refetch };
}
