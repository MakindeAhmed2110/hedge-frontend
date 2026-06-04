import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AuthModalContextValue = {
  isOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAuth = useCallback(() => setIsOpen(true), []);
  const closeAuth = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openAuth, closeAuth }),
    [isOpen, openAuth, closeAuth]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
