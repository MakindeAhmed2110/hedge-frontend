import type { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { SignInRequired } from "~/components/auth/sign-in-required";

type RequireAuthProps = {
  children: ReactNode;
  /** Shown below the title when provided. */
  message?: string;
};

/**
 * Renders children only when Privy is ready and the user is signed in.
 * Otherwise shows a centered sign-in prompt (no page content).
 */
export function RequireAuth({ children, message }: RequireAuthProps) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="sign-in-required sign-in-required--loading">
        <span className="portfolio-assets__spinner" aria-hidden />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="portfolio-page--auth-gate">
        <SignInRequired message={message} />
      </div>
    );
  }

  return children;
}
