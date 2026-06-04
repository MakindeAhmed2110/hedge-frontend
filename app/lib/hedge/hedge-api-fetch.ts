import { HEDGE_API_BASE_URL } from "~/constants/hedge-api";
import type { HedgePointsSummary, HedgeReferralsResponse, HedgeUserProfile } from "~/lib/hedge/types";

export class HedgeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HedgeApiError";
    this.status = status;
  }
}

function parseError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string") return err;
  }
  return fallback;
}

export async function hedgeApiFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${HEDGE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HedgeApiError(
      parseError(payload, `Request failed (${response.status})`),
      response.status
    );
  }

  return payload as T;
}

export async function fetchHedgePoints(accessToken: string): Promise<HedgePointsSummary> {
  const json = await hedgeApiFetch<{ data: HedgePointsSummary }>(
    accessToken,
    "/users/me/points"
  );
  return json.data;
}

export async function fetchHedgeMe(accessToken: string): Promise<HedgeUserProfile> {
  const json = await hedgeApiFetch<{ data: HedgeUserProfile }>(accessToken, "/users/me");
  return json.data;
}

export async function fetchHedgeReferrals(
  accessToken: string
): Promise<HedgeReferralsResponse> {
  const json = await hedgeApiFetch<{ data: HedgeReferralsResponse }>(
    accessToken,
    "/users/me/referrals"
  );
  return json.data;
}
