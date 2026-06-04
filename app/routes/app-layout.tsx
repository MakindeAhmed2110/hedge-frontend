import { Outlet } from "react-router";

import { DesktopSidebar } from "~/components/navigation/desktop-sidebar";
import { MobileTabBar } from "~/components/navigation/mobile-tab-bar";
import { HedgeScreenBackground } from "~/components/ui/hedge-screen-background";

export default function AppLayout() {
  return (
    <>
      <HedgeScreenBackground />
      <div className="hedge-shell">
        <DesktopSidebar />
        <div className="hedge-main">
          <Outlet />
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
