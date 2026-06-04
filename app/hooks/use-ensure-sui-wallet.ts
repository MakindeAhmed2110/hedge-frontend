import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

import { getSuiAddressFromUser } from "~/lib/privy/user-accounts";

export function useEnsureSuiWallet() {
  const { user, ready } = usePrivy();
  const { createWallet } = useCreateWallet();

  const ensureSuiWallet = useCallback(async () => {
    if (!ready) throw new Error("Privy is not ready yet.");
    if (getSuiAddressFromUser(user)) return user;
    const { user: updated } = await createWallet({ chainType: "sui" });
    return updated;
  }, [createWallet, ready, user]);

  return {
    ensureSuiWallet,
    hasSuiWallet: Boolean(getSuiAddressFromUser(user)),
    suiAddress: getSuiAddressFromUser(user),
  };
}
