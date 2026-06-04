/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_PRIVY_CLIENT_ID: string;
  readonly VITE_HEDGE_API_BASE_URL: string;
  readonly VITE_PREDICT_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
