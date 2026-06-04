import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("api/wallets/sui-sign", "routes/api.wallets.sui-sign.ts"),
  route("api/hedge/register", "routes/api.hedge.register.ts"),
  layout("routes/app-layout.tsx", [
    index("routes/index-redirect.tsx"),
    route("play", "routes/play.tsx"),
    route("portfolio", "routes/portfolio.tsx"),
    route("vaults", "routes/vaults.tsx"),
    route("positions", "routes/positions.tsx"),
    route("rep", "routes/rep.tsx"),
    route("points", "routes/points.tsx"),
    route("referrals", "routes/referrals.tsx"),
    route("history", "routes/history.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("events", "routes/events.tsx"),
  ]),
] satisfies RouteConfig;
