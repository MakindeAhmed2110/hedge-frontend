import { usePrivy } from "@privy-io/react-auth";
import { useEffect, type ReactNode } from "react";

import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";
import { useHedgeRegisterSync } from "~/hooks/use-hedge-register-sync";

export function HedgeBootstrap({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { ensureSuiWallet, hasSuiWallet } = useEnsureSuiWallet();

  useHedgeRegisterSync();

  useEffect(() => {
    if (!ready || !authenticated || hasSuiWallet) return;
    void ensureSuiWallet().catch((err) => {
      console.warn("[ensure-sui-wallet]", err);
    });
  }, [authenticated, ensureSuiWallet, hasSuiWallet, ready]);

  return children;
}
