import {
  fetchHedgeMe,
  fetchHedgePoints,
  fetchHedgeReferrals,
  hedgeApiFetch,
} from "~/lib/hedge/hedge-api-fetch";
import type {
  HedgePointsSummary,
  HedgeReferralsResponse,
  HedgeUserProfile,
} from "~/lib/hedge/types";

export { fetchHedgePoints, fetchHedgeMe, fetchHedgeReferrals };

export async function applyHedgeReferralCode(
  accessToken: string,
  referralCode: string
): Promise<HedgeUserProfile> {
  const json = await hedgeApiFetch<{ data: HedgeUserProfile }>(
    accessToken,
    "/users/me/referral",
    {
      method: "POST",
      body: JSON.stringify({ referralCode }),
    }
  );
  return json.data;
}

export type { HedgePointsSummary, HedgeReferralsResponse, HedgeUserProfile };
