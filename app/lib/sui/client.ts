/**
 * @deprecated Use `lib/sui/rpc.ts` for reads and `getSuiTestnetBuildClient()` for tx build.
 * Kept so existing imports do not pull in @mysten/sui/jsonRpc at startup.
 */
export { getSuiTestnetBuildClient as getSuiTestnetClient } from '~/lib/sui/build-client';
