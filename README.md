# Hedge Web

React Router web client with **feature parity** to the Expo app for Predict trading, portfolio, positions, vaults, points, and referrals.

## Setup

```bash
cp .env.example .env
```

Required in `.env`:

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_PRIVY_APP_ID` | Client | Privy app id (same app as mobile) |
| `VITE_PRIVY_CLIENT_ID` | Client | **Web** client id from Privy dashboard |
| `VITE_HEDGE_API_BASE_URL` | Client | Points, referrals, profile — `Authorization: Bearer <Privy JWT>` |
| `HEDGE_API_URL` | Server | Same API host for `/api/hedge/register` proxy |
| `HEDGE_SERVICE_KEY` | Server | **Not** `VITE_*` — BFF → backend on register (match Railway + `my-app`) |
| `PRIVY_APP_ID` | Server | Same app id — `/api/wallets/sui-sign` |
| `PRIVY_APP_SECRET` | Server | **Never** `VITE_*` (would ship in the browser bundle) |

In [Privy](https://dashboard.privy.io), add **Allowed origins** (e.g. `http://localhost:5173`).

## Dev

```bash
pnpm install
pnpm dev
```

- `/play` — markets + Up/Down/Range mints (Privy Sui signing)
- `/positions` — open positions + close/redeem
- `/vaults` — range ladder deploy/close/roll
- `/portfolio` — wallet balances
- `/rep` — on-chain activity
- `/points`, `/referrals` — Hedge API (Privy JWT)

Mobile layout uses the same cards as the app; desktop uses a Polymarket-style grid + left sidebar nav.

## Architecture

- Shared logic ported from `my-app/lib` (predict, sui, hedge)
- Client signing: `@privy-io/react-auth/extended-chains` (`useSignRawHash`, `useCreateWallet` for Sui)
- Server routes: `POST /api/wallets/sui-sign`, `POST /api/hedge/register` (secrets stay on server)

## Re-sync assets from mobile

```bash
rsync -a ../my-app/assets/images/ public/assets/images/
rsync -a ../my-app/assets/markets/ public/assets/markets/
rsync -a ../my-app/assets/fonts/ public/fonts/
```
