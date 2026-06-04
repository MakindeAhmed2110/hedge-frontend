export function formatLeaderboardAddress(address: string): string {
  if (address.length <= 10) return address;
  if (address.startsWith('0x')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatLeaderboardPoints(value: number): string {
  if (value == null || Number.isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getLeaderboardDisplayName(
  user: { handle?: string; userAddress: string }
): string {
  return user.handle || formatLeaderboardAddress(user.userAddress);
}
