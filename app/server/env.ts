export function getPrivyServerCredentials() {
  const appId = process.env.PRIVY_APP_ID ?? process.env.VITE_PRIVY_APP_ID ?? "";
  const appSecret = process.env.PRIVY_APP_SECRET ?? "";
  if (!appId || !appSecret) {
    throw new Error("Missing PRIVY_APP_ID or PRIVY_APP_SECRET (server only).");
  }
  return { appId, appSecret };
}

export function getHedgeServerCredentials() {
  const hedgeApiUrl = (
    process.env.HEDGE_API_URL ??
    process.env.VITE_HEDGE_API_BASE_URL ??
    "https://api.hedgeapp.trade"
  ).replace(/\/$/, "");
  const serviceKey = process.env.HEDGE_SERVICE_KEY ?? "";
  if (!serviceKey) {
    throw new Error("Missing HEDGE_SERVICE_KEY (server only).");
  }
  return { hedgeApiUrl, serviceKey };
}
