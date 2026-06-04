const TESTNET_FAUCET_HOST = 'https://faucet.testnet.sui.io';

type FaucetResponse = {
  status: 'Success' | { Failure: { internal: string } };
};

/** Request testnet SUI for gas from the official Mysten faucet. */
export async function requestTestnetSui(recipient: string) {
  const response = await fetch(`${TESTNET_FAUCET_HOST}/v2/gas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      FixedAmountRequest: { recipient },
    }),
  });

  if (response.status === 429) {
    throw new Error('Faucet rate limited. Try again later or use faucet.sui.io.');
  }

  if (!response.ok) {
    throw new Error(`Faucet HTTP ${response.status}`);
  }

  const json = (await response.json()) as FaucetResponse;
  if (json.status !== 'Success') {
    const failure =
      typeof json.status === 'object' && json.status.Failure
        ? json.status.Failure.internal
        : 'Unknown faucet error';
    throw new Error(failure);
  }

  return json;
}
