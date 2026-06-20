import { useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { RequireAuth } from "~/components/auth/require-auth";
import { useMediaQuery } from "~/hooks/use-media-query";

type HedgePageModalShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Light blue wash (points page). */
  variant?: "default" | "points";
  requireAuth?: boolean;
  requireAuthMessage?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Use full panel width (e.g. leaderboard podium). */
  wide?: boolean;
  /** Wider content column inside the panel (e.g. positions list). */
  contentWide?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
};

export function HedgePageModalShell({
  title,
  subtitle,
  children,
  footer,
  variant = "default",
  requireAuth = false,
  requireAuthMessage,
  onRefresh,
  isRefreshing = false,
  wide = false,
  contentWide = false,
  searchPlaceholder,
  searchQuery = "",
  onSearchQueryChange,
}: HedgePageModalShellProps) {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/play");
  }, [navigate]);

  useEffect(() => {
    if (isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [handleClose, isDesktop]);

  const panelClass =
    variant === "points" ? "hedge-panel hedge-panel--points" : "hedge-panel";

  const pageContent = (
    <div
      className={
        wide
          ? "hedge-panel__inner hedge-panel__inner--wide"
          : contentWide
            ? "hedge-panel__inner hedge-panel__inner--content-wide"
            : "hedge-panel__inner"
      }>
      <header className="hedge-panel__hero">
        <h1 id="hedge-panel-page-title" className="hedge-panel__title">
          {title}
        </h1>
        {subtitle ? <p className="hedge-panel__subtitle">{subtitle}</p> : null}
      </header>
      <div
        className={
          wide ? "hedge-panel__content hedge-panel__content--wide" : "hedge-panel__content"
        }>
        {children}
      </div>
    </div>
  );

  return (
    <div
      className="hedge-panel-overlay"
      role="presentation"
      onClick={isDesktop ? undefined : handleClose}>
      <aside
        className={panelClass}
        role={isDesktop ? undefined : "dialog"}
        aria-modal={isDesktop ? undefined : true}
        aria-labelledby="hedge-panel-page-title"
        onClick={(e) => e.stopPropagation()}>
        <header className="hedge-panel__chrome">
          <button
            type="button"
            className="hedge-panel__back"
            onClick={handleClose}
            aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {onRefresh ? (
            <button
              type="button"
              className="hedge-panel__refresh"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh">
              {isRefreshing ? (
                <span
                  className="portfolio-assets__spinner hedge-panel__refresh-spinner"
                  aria-hidden
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 12a8 8 0 0114.93-4M20 12a8 8 0 01-14.93 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 4v4h-4M4 20v-4h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ) : (
            <span className="hedge-panel__chrome-spacer" aria-hidden />
          )}
        </header>

        {searchPlaceholder && onSearchQueryChange ? (
          <div className="hedge-panel__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="hedge-panel__search-input"
            />
          </div>
        ) : null}

        <div
          className={
            requireAuth ? "hedge-panel__scroll hedge-panel__scroll--auth" : "hedge-panel__scroll"
          }>
          {requireAuth ? (
            <RequireAuth message={requireAuthMessage}>{pageContent}</RequireAuth>
          ) : (
            pageContent
          )}
        </div>

        {footer ? <footer className="hedge-panel__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
