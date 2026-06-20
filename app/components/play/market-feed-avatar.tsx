export function addressHue(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 68%, 52%)`;
}

type MarketFeedAvatarProps = {
  seed: string;
  size?: number;
};

export function MarketFeedAvatar({ seed, size = 28 }: MarketFeedAvatarProps) {
  return (
    <span
      className="market-feed-avatar"
      style={{ width: size, height: size, backgroundColor: addressHue(seed) }}
      aria-hidden
    />
  );
}
