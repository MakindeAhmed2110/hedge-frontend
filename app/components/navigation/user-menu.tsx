import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { useSuiAccount } from "~/hooks/use-sui-account";

const MASCOT_SRC = "/assets/images/default-avatar.png";

export function UserMenu() {
  const { t } = useTranslation();
  const { logout } = useSuiAccount();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const handleLogout = () => {
    close();
    void logout();
  };

  return (
    <div className="hedge-user-menu" ref={rootRef}>
      <button
        type="button"
        className="hedge-user-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("profile.settings")}>
        <img src={MASCOT_SRC} alt="" className="hedge-user-menu__mascot" />
      </button>

      {open ? (
        <div className="hedge-user-menu__dropdown" role="menu">
          <Link
            to="/positions"
            role="menuitem"
            className="hedge-user-menu__item"
            onClick={close}>
            {t("menu.positions")}
          </Link>
          <Link
            to="/portfolio"
            role="menuitem"
            className="hedge-user-menu__item"
            onClick={close}>
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="hedge-user-menu__item hedge-user-menu__item--danger"
            onClick={handleLogout}>
            {t("profile.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
