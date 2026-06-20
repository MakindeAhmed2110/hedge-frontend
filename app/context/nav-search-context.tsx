import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type NavSearchContextValue = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const NavSearchContext = createContext<NavSearchContextValue | null>(null);

export function NavSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  const value = useMemo(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery]
  );

  return <NavSearchContext.Provider value={value}>{children}</NavSearchContext.Provider>;
}

export function useNavSearch() {
  const ctx = useContext(NavSearchContext);
  if (!ctx) {
    throw new Error("useNavSearch must be used within NavSearchProvider");
  }
  return ctx;
}
