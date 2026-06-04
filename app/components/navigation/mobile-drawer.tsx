import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { SIDE_MENU_ITEMS } from "~/constants/side-menu";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { t } = useTranslation();
  const location = useLocation();

  if (!open) return null;

  return (
    <>
      <button type="button" className="drawer-overlay" aria-label="Close menu" onClick={onClose} />
      <div className="drawer-panel" role="dialog" aria-modal>
        <div className="flex items-center gap-2 mb-6">
          <img src="/assets/images/logo-icon-blue.png" alt="" width={32} height={32} />
          <span className="text-lg font-bold">Hedge</span>
        </div>
        <nav className="flex flex-col gap-1">
          {SIDE_MENU_ITEMS.map(({ id, labelKey, Icon, href }) => (
            <Link
              key={id}
              to={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 no-underline font-semibold ${
                location.pathname === href
                  ? "bg-[rgba(30,110,243,0.08)] text-hedge-primary"
                  : "text-hedge-fg"
              }`}>
              <Icon width={22} height={22} />
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
