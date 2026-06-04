import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import { getUsernameFromUser, normalizeUsername } from "~/lib/privy/custom-metadata";
import { getStoredUsername, setStoredUsername } from "~/lib/preferences/username";
import { getEmailFromUser } from "~/lib/privy/user-accounts";

function defaultHandleFromEmail(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  const normalized = normalizeUsername(local);
  return normalized.length >= 3 ? normalized : null;
}

export function useAppUsername() {
  const { user } = usePrivy();
  const [username, setUsername] = useState<string | null>(() => getUsernameFromUser(user));
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsername(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const fromMeta = getUsernameFromUser(user);
    const stored = await getStoredUsername(user.id);
    const fallback = defaultHandleFromEmail(getEmailFromUser(user));
    setUsername(fromMeta ?? stored ?? fallback);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveUsername = useCallback(
    async (input: string) => {
      if (!user) throw new Error("Sign in to set a handle.");
      const normalized = normalizeUsername(input);
      await setStoredUsername(user.id, normalized);
      setUsername(normalized);
    },
    [user]
  );

  return {
    username,
    hasUsername: Boolean(username && username.length >= 3),
    isLoading,
    saveUsername,
    refresh,
  };
}
