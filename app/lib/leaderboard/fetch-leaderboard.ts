import { HEDGE_API_BASE_URL } from "~/constants/hedge-api";

import type { HedgeLeaderboardApiResponse, LeaderboardUser } from "~/lib/leaderboard/types";

export class LeaderboardFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaderboardFetchError";
  }
}

function mapItem(item: HedgeLeaderboardApiResponse["data"]["items"][number]): LeaderboardUser {
  return {
    userAddress: item.userAddress,
    experience: {
      totalXp: item.experience.totalXp,
      rankIndex: item.rank,
      totalFeesPaidInUsd: item.experience.totalFeesPaidInUsd ?? 0,
      level: item.experience.level,
      rankName: item.experience.rankName,
    },
    handle: item.handle,
    profilePictureUrl: undefined,
    vip: false,
    earlyAccess: false,
    rankName: item.experience.rankName ?? "Unranked",
  };
}

export async function fetchExperienceLeaderboard(limit = 100): Promise<LeaderboardUser[]> {
  const url = `${HEDGE_API_BASE_URL}/leaderboard?limit=${limit}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LeaderboardFetchError(
      body || `Failed to load leaderboard (${response.status}).`
    );
  }

  const json = (await response.json()) as HedgeLeaderboardApiResponse;
  return (json.data?.items ?? []).map(mapItem);
}
