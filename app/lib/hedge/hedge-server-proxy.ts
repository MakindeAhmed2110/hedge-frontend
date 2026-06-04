import { getHedgeApiCredentials } from '~/lib/hedge/hedge-api-credentials';
import { getPrivyApiCredentials } from '~/lib/privy/privy-api-credentials';
import { verifyPrivyAccessToken } from '~/lib/privy/verify-access-token';

type ProxyOptions = {
  method?: string;
  body?: unknown;
};

export async function proxyToHedgeApi(
  request: Request,
  path: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const { hedgeApiUrl, serviceKey } = getHedgeApiCredentials();
  const { appId } = getPrivyApiCredentials();

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return Response.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  const claims = await verifyPrivyAccessToken(accessToken, appId);

  const upstream = await fetch(`${hedgeApiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'X-Privy-User-Id': claims.user_id,
      'Content-Type': 'application/json',
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await upstream.json().catch(() => ({}));
  return Response.json(payload, { status: upstream.status });
}
