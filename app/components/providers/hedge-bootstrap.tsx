import { usePrivy } from "@privy-io/react-auth";
import { useEffect, type ReactNode } from "react";

import { useAppLanguage } from "~/hooks/use-app-language";
import { useEnsureSuiWallet } from "~/hooks/use-ensure-sui-wallet";
import { useHedgeRegisterSync } from "~/hooks/use-hedge-register-sync";
import { fetchOracleCatalogCached } from "~/lib/predict/predict-server";

export function HedgeBootstrap({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { ensureSuiWallet, hasSuiWallet } = useEnsureSuiWallet();

  useAppLanguage();
  useHedgeRegisterSync();

  useEffect(() => {
    void fetchOracleCatalogCached().catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !authenticated || hasSuiWallet) return;
    void ensureSuiWallet().catch((err) => {
      console.warn("[ensure-sui-wallet]", err);
    });
  }, [authenticated, ensureSuiWallet, hasSuiWallet, ready]);

  return children;
}
