import { GetStartedButton } from "~/components/onboarding/get-started-button";
import { useAppUsername } from "~/hooks/use-app-username";
import { usePrivy } from "@privy-io/react-auth";

type AppHeaderProps = {
  searchPlaceholder: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onMenuPress: () => void;
  title?: string;
};

export function AppHeader({
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  onMenuPress,
  title,
}: AppHeaderProps) {
  const { authenticated, user } = usePrivy();
  const { hasUsername } = useAppUsername();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-hedge-border px-4 py-3 lg:px-8">
      <div className="flex items-center gap-3 max-w-[1400px] mx-auto">
        <button
          type="button"
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-hedge-border bg-white cursor-pointer"
          onClick={onMenuPress}
          aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {title ? (
          <h1 className="text-lg lg:text-2xl font-bold tracking-tight m-0 flex-shrink-0 max-w-[28vw] lg:max-w-none truncate">
            {title}
          </h1>
        ) : null}

        <div className="flex-1 flex items-center gap-2 rounded-2xl border border-hedge-border bg-hedge-surface/60 px-3 py-2.5 min-w-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-hedge-muted flex-shrink-0" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 border-0 bg-transparent outline-none text-[15px] min-w-0"
          />
        </div>

        <GetStartedButton variant="icon" />
        {authenticated && hasUsername ? (
          <div
            className="w-10 h-10 rounded-full overflow-hidden border border-hedge-border flex-shrink-0 bg-hedge-surface flex items-center justify-center text-xs font-semibold text-hedge-primary"
            title={user?.email?.address ?? "Account"}>
            <img src="/assets/images/logo-icon-blue.png" alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
      </div>
    </header>
  );
}
