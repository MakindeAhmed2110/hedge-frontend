export type LeaderboardExperience = {
  totalXp: number;
  rankIndex: number;
  totalFeesPaidInUsd: number;
  level: number;
  rankName?: string;
};

export type LeaderboardUser = {
  userAddress: string;
  experience: LeaderboardExperience;
  handle?: string;
  profilePictureUrl?: string;
  vip: boolean;
  earlyAccess: boolean;
  rankName: string;
};

export type HedgeLeaderboardApiItem = {
  rank: number;
  userAddress: string;
  handle?: string;
  referralCode?: string;
  experience: {
    totalXp: number;
    weekXp?: number;
    level: number;
    rankName?: string;
    totalFeesPaidInUsd?: number;
  };
  stats?: {
    lifetimeVolumeUsd?: number;
    weekVolumeUsd?: number;
  };
};

export type HedgeLeaderboardApiResponse = {
  data: {
    items: HedgeLeaderboardApiItem[];
    metric?: string;
  };
  meta?: string;
};
