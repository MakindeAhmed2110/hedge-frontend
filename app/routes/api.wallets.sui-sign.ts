import { buildSuiTransactionIntentHex } from "~/lib/sui/intent-signing";
import { rawSignSuiIntentMessage } from "~/lib/privy/privy-raw-sign";
import { verifyPrivyAccessToken } from "~/lib/privy/verify-access-token";
import { getPrivyServerCredentials } from "~/server/env";

const PRIVY_AUTH_BASE = "https://auth.privy.io/api/v1";

type LinkedWallet = {
  id?: string | null;
  address?: string;
  chain_type?: string;
  public_key?: string;
};

async function findUserSuiWallet(
  appId: string,
  appSecret: string,
  userId: string,
  address: string
): Promise<LinkedWallet | null> {
  const response = await fetch(`${PRIVY_AUTH_BASE}/users/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`,
      "privy-app-id": appId,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not load Privy user (${response.status})`);
  }

  const user = (await response.json()) as { linked_accounts?: LinkedWallet[] };
  const wallets = user.linked_accounts ?? [];
  return (
    wallets.find(
      (account) =>
        account.chain_type === "sui" &&
        account.address?.toLowerCase() === address.toLowerCase()
    ) ?? null
  );
}

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { appId, appSecret } = getPrivyServerCredentials();
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return Response.json({ error: "Missing authorization token." }, { status: 401 });
    }

    const body = (await request.json()) as { transactionBlock?: string; address?: string };
    const { transactionBlock, address } = body;
    if (!transactionBlock || !address) {
      return Response.json(
        { error: "transactionBlock and address are required." },
        { status: 400 }
      );
    }

    const claims = await verifyPrivyAccessToken(accessToken, appId);
    const wallet = await findUserSuiWallet(appId, appSecret, claims.user_id, address);

    if (!wallet?.id) {
      return Response.json({ error: "Sui wallet not found for this user." }, { status: 404 });
    }

    const txBytes = Buffer.from(transactionBlock, "base64");
    const intentMessageHex = buildSuiTransactionIntentHex(new Uint8Array(txBytes));

    const { signature } = await rawSignSuiIntentMessage(
      appId,
      appSecret,
      wallet.id,
      intentMessageHex
    );

    return Response.json({
      signature,
      publicKey: wallet.public_key ?? null,
    });
  } catch (error) {
    console.error("[POST /api/wallets/sui-sign]", error);
    const message = error instanceof Error ? error.message : "Failed to sign transaction.";
    const isAuthError =
      message.includes("token") ||
      message.includes("JWT") ||
      message.includes("expired") ||
      message.includes("signature");
    return Response.json(
      { error: isAuthError ? "Invalid or expired session. Sign in again." : message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
