import { USDC_LOGO_IMAGE } from "~/constants/receive";
import { SUI_NETWORK_IMAGE } from "~/constants/receive";
import {
  DBUSDC_COIN_TYPE,
  DBUSDC_DECIMALS,
  DUSDC_COIN_TYPE,
  DUSDC_DECIMALS,
} from "~/constants/sui";

export const TESTNET_SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

export const SUI_DECIMALS = 9;
export const SUI_GAS_RESERVE_MIST = 100_000_000n;

export type SendTokenId = "dusdc" | "dbusdc" | "sui";

export function isStablecoinToken(token: SendTokenConfig): boolean {
  return Boolean(token.amountPrefix);
}

export type SendTokenConfig = {
  id: SendTokenId;
  symbol: string;
  name: string;
  coinType: string;
  decimals: number;
  icon: string;
  amountPrefix: string;
};

export const SEND_TOKENS: Record<SendTokenId, SendTokenConfig> = {
  dusdc: {
    id: "dusdc",
    symbol: "DUSDC",
    name: "DUSDC",
    coinType: DUSDC_COIN_TYPE,
    decimals: DUSDC_DECIMALS,
    icon: USDC_LOGO_IMAGE,
    amountPrefix: "$",
  },
  dbusdc: {
    id: "dbusdc",
    symbol: "DBUSDC",
    name: "DeepBook USDC",
    coinType: DBUSDC_COIN_TYPE,
    decimals: DBUSDC_DECIMALS,
    icon: USDC_LOGO_IMAGE,
    amountPrefix: "$",
  },
  sui: {
    id: "sui",
    symbol: "SUI",
    name: "Sui",
    coinType: TESTNET_SUI_COIN_TYPE,
    decimals: SUI_DECIMALS,
    icon: SUI_NETWORK_IMAGE,
    amountPrefix: "",
  },
};

export const SEND_TOKEN_LIST: SendTokenConfig[] = [
  SEND_TOKENS.dusdc,
  SEND_TOKENS.dbusdc,
  SEND_TOKENS.sui,
];
