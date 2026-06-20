import { Outlet } from "react-router";

import { DesktopTopNav } from "~/components/navigation/desktop-top-nav";
import { MobileTabBar } from "~/components/navigation/mobile-tab-bar";
import { NavSearchProvider } from "~/context/nav-search-context";
import { HedgeScreenBackground } from "~/components/ui/hedge-screen-background";

export default function AppLayout() {
  return (
    <NavSearchProvider>
      <HedgeScreenBackground />
      <div className="hedge-shell">
        <DesktopTopNav />
        <div className="hedge-main">
          <Outlet />
        </div>
      </div>
      <MobileTabBar />
    </NavSearchProvider>
  );
}
