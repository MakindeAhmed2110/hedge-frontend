import { verifyPrivyAccessToken } from "~/lib/privy/verify-access-token";
import { getHedgeServerCredentials, getPrivyServerCredentials } from "~/server/env";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { hedgeApiUrl, serviceKey } = getHedgeServerCredentials();
    const { appId } = getPrivyServerCredentials();

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return Response.json({ error: "Missing authorization token." }, { status: 401 });
    }

    const body = (await request.json()) as {
      suiAddress?: string;
      handle?: string;
      referralCode?: string;
    };

    if (!body.suiAddress?.trim() || !body.handle?.trim()) {
      return Response.json({ error: "suiAddress and handle are required." }, { status: 400 });
    }

    const claims = await verifyPrivyAccessToken(accessToken, appId);

    const upstream = await fetch(`${hedgeApiUrl}/users/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "X-Privy-User-Id": claims.user_id,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        suiAddress: body.suiAddress.trim().toLowerCase(),
        handle: body.handle.trim(),
        referralCode: body.referralCode?.trim() || undefined,
      }),
    });

    const payload = await upstream.json().catch(() => ({}));
    return Response.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("[POST /api/hedge/register]", error);
    const message = error instanceof Error ? error.message : "Registration failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
