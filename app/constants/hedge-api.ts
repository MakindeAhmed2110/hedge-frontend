export const HEDGE_API_BASE_URL = (
  import.meta.env.VITE_HEDGE_API_BASE_URL?.trim() || "https://api.hedgeapp.trade"
).replace(/\/$/, "");
