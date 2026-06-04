import { useEffect, type ReactNode } from "react";

type HedgeOverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function HedgeOverlay({ open, onClose, title, children, footer }: HedgeOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="hedge-overlay" role="presentation" onClick={onClose}>
      <div
        className="hedge-overlay__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hedge-overlay-title"
        onClick={(e) => e.stopPropagation()}>
        <header className="hedge-overlay__header">
          <button
            type="button"
            className="hedge-overlay__back"
            onClick={onClose}
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
          <h2 id="hedge-overlay-title" className="hedge-overlay__title">
            {title}
          </h2>
          <span className="hedge-overlay__back-spacer" aria-hidden />
        </header>
        <div className="hedge-overlay__body">{children}</div>
        {footer ? <footer className="hedge-overlay__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
