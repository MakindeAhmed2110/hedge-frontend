import { useTranslation } from "react-i18next";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";
import { TabEmptyState } from "~/components/ui/tab-empty-state";

export default function EventsRoute() {
  const { t } = useTranslation();

  return (
    <HedgePageModalShell title={t("menu.events")} subtitle={t("events.subtitle")}>
      <div className="events-page__empty">
        <TabEmptyState
          variant="card"
          icon="calendar"
          title={t("events.emptyTitle")}
          message={t("events.emptyMessage")}
        />
      </div>
    </HedgePageModalShell>
  );
}
