import { HedgeApiError, hedgeApiFetch } from "~/lib/hedge/hedge-api-fetch";
import type { HedgePointsSummary } from "~/lib/hedge/types";

export type RecordHedgeMintParams = {
  txDigest: string;
  stakeUsd: number;
  oracleId?: string;
  predictId?: string;
  managerId?: string;
};

export type RecordHedgeMintResult = {
  recorded: boolean;
  pointsCredited: number;
  stakeUsd: number;
  points: HedgePointsSummary;
};

export async function recordHedgeMint(
  accessToken: string,
  params: RecordHedgeMintParams
): Promise<RecordHedgeMintResult> {
  const json = await hedgeApiFetch<{ data: RecordHedgeMintResult }>(
    accessToken,
    "/users/me/mints",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
  return json.data;
}

export { HedgeApiError };
