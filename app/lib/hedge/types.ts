export type HedgePointsSummary = {
  totalPoints: number;
  weeklyPoints: number;
  weeklySummary: Array<{ date: string; points: number }>;
};

export type HedgeUserProfile = {
  userAddress: string;
  privyUserId: string;
  handle: string;
  referralCode: string | null;
  referralUrl: string | null;
  hasReferrer: boolean;
  stats: {
    lifetimeVolumeUsd: number;
    weekVolumeUsd: number;
    totalPoints: number;
    weekPoints: number;
    winCount: number;
    lossCount: number;
    currentStreakDays: number;
  };
};

export type HedgeReferralRow = {
  id: string;
  userAddress: string;
  handle: string;
  joinedAt: string;
  lifetimeVolumeUsd: number;
};

export type HedgeReferralsResponse = {
  totalReferrals: number;
  referrals: HedgeReferralRow[];
};

export type HedgeReferralsConfig = {
  appUrl: string;
  refParam: string;
  example: string;
};

export type HedgeReferralValidateResult = {
  valid: boolean;
  kind?: string;
  handle?: string;
  ref?: string;
};
