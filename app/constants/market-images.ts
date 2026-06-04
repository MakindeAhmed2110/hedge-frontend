export const MARKET_ASSET_ICON = "/assets/markets/bitcoin.jpg";

export const MARKET_CARD_IMAGES = [
  "/assets/markets/btc-one.jpg",
  "/assets/markets/btc-three.jpg",
  "/assets/markets/btc-four.png",
  "/assets/markets/btc-five.jpg",
  "/assets/markets/btc-six.jpg",
  "/assets/markets/btc-seven.jpg",
  "/assets/markets/btc-eight.jpg",
  "/assets/markets/btc-nine.jpg",
  "/assets/markets/btc-ten.jpg",
] as const;

export function marketCardImage(index: number): string {
  return MARKET_CARD_IMAGES[index % MARKET_CARD_IMAGES.length]!;
}
