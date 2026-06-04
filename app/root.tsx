import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { SITE_TITLE } from "~/constants/brand";
import { HedgeProviders } from "~/providers/hedge-providers";
import "./app.css";

export const meta: Route.MetaFunction = () => [
  { title: SITE_TITLE },
  {
    name: "description",
    content: "Trade prediction markets on Sui — Up, Down, and Range.",
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1E6EF3" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <HedgeProviders>
      <Outlet />
    </HedgeProviders>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p className="text-hedge-muted">{details}</p>
      {stack ? (
        <pre className="text-xs overflow-x-auto mt-4 p-4 bg-hedge-surface rounded-xl">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
