import { SUI_TESTNET_RPC_URL } from '~/constants/sui';

/** Lazy-load Mysten client for transaction building (not imported at app startup). */
export async function getSuiTestnetBuildClient() {
  const { SuiJsonRpcClient } = await import('@mysten/sui/jsonRpc');
  return new SuiJsonRpcClient({
    url: SUI_TESTNET_RPC_URL,
    network: 'testnet',
  });
}
