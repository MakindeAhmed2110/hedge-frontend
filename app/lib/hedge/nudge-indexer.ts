import { appApiUrl } from '~/lib/hedge/api-base-url';

/**
 * Ask the BFF to run the Hedge predict indexer (non-blocking on the API).
 * Points are credited server-side when your wallet matches a registered user.
 */
export async function nudgeHedgeIndexer(accessToken: string): Promise<void> {
  try {
    await fetch(appApiUrl('/api/hedge/indexer/run'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Best-effort; cron or manual run can catch up later.
  }
}
