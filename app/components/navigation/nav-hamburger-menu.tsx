import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { SIDE_MENU_ITEMS } from "~/constants/side-menu";
import type { LanguageId } from "~/constants/languages";
import { useAppLanguage } from "~/hooks/use-app-language";
import { LanguagePickerPanel } from "~/components/navigation/language-picker-panel";

export function NavHamburgerMenu() {
  const { t } = useTranslation();
  const location = useLocation();
  const { languageId, language, setLanguage } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [pendingLanguageId, setPendingLanguageId] = useState<LanguageId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setLanguageOpen(false);
  }, []);

  useEffect(() => {
    if (!open && !languageOpen) return;

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
  }, [open, languageOpen, close]);

  const handleLanguageSelect = async (id: LanguageId) => {
    if (id === languageId) return;
    setPendingLanguageId(id);
    try {
      await setLanguage(id);
    } finally {
      setPendingLanguageId(null);
    }
  };

  return (
    <div className="hedge-nav-menu" ref={rootRef}>
      <button
        type="button"
        className="hedge-nav-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("menu.openNavigation")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          className={
            languageOpen ? "hedge-nav-menu__panel hedge-nav-menu__panel--language-open" : "hedge-nav-menu__panel"
          }
          role="menu">
          <div className="hedge-nav-menu__panel-scroll">
            <nav className="hedge-nav-menu__links">
              {SIDE_MENU_ITEMS.map(({ id, labelKey, Icon, href }) => {
                const active = location.pathname === href;
                return (
                  <Link
                    key={id}
                    to={href}
                    role="menuitem"
                    className={
                      active
                        ? "hedge-nav-menu__link hedge-nav-menu__link--active"
                        : "hedge-nav-menu__link"
                    }
                    onClick={close}>
                    <Icon width={20} height={20} aria-hidden />
                    <span>{t(labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hedge-nav-menu__divider" role="separator" />

          <div className="hedge-nav-menu__language">
            <button
              type="button"
              className={
                languageOpen
                  ? "hedge-nav-menu__language-toggle hedge-nav-menu__language-toggle--open"
                  : "hedge-nav-menu__language-toggle"
              }
              onClick={() => {
                setOpen(true);
                setLanguageOpen((value) => !value);
              }}
              aria-expanded={languageOpen}>
              <span className="hedge-nav-menu__language-flag" aria-hidden>
                {language.flag}
              </span>
              <span className="hedge-nav-menu__language-label">{t("language.title")}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="hedge-nav-menu__language-chevron"
                aria-hidden>
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {languageOpen ? (
              <LanguagePickerPanel
                languageId={languageId}
                pendingLanguageId={pendingLanguageId}
                onSelect={(id) => void handleLanguageSelect(id)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
