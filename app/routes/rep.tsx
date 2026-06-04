import { useTranslation } from "react-i18next";

import { useSuiAccount } from "~/hooks/use-sui-account";
import { useSuiActivity } from "~/hooks/use-sui-activity";

export default function RepRoute() {
  const { t } = useTranslation();
  const { suiAddress } = useSuiAccount();
  const { sections, isLoading, error } = useSuiActivity(suiAddress);

  return (
    <div className="px-4 py-6 lg:px-8 max-w-2xl mx-auto w-full">
      <h1 className="text-[29px] font-bold m-0 mb-4">{t("tabs.rep")}</h1>

      {isLoading ? (
        <p className="text-hedge-muted">Loading activity…</p>
      ) : error ? (
        <div className="glass-card text-red-600">{error}</div>
      ) : sections.length === 0 ? (
        <div className="glass-card text-center text-hedge-muted py-8">No recent activity</div>
      ) : (
        sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-sm font-semibold text-hedge-muted mb-2">{section.title}</h2>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {section.data.map((tx) => (
                <li key={tx.id} className="glass-card flex items-center gap-3 py-3">
                  <img src={tx.logo} alt="" className="w-9 h-9 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold m-0 text-sm">
                      {tx.type === "receive" ? "Receive" : "Send"} {tx.symbol}
                    </p>
                    <p className="text-xs text-hedge-muted m-0">{tx.label}</p>
                  </div>
                  <p
                    className={`font-semibold text-sm m-0 ${tx.type === "receive" ? "text-emerald-600" : ""}`}>
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.symbol}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
