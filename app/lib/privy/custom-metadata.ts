import type { User } from "@privy-io/react-auth";

type CustomMetadata = NonNullable<User["customMetadata"]>;

export const USERNAME_METADATA_KEY = 'username';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function getCustomMetadata(user: User | null): CustomMetadata | null {
  if (!user) return null;
  return user.customMetadata ?? null;
}

export function getUsernameFromUser(user: User | null): string | null {
  const metadata = getCustomMetadata(user);
  if (!metadata) return null;

  const value = metadata[USERNAME_METADATA_KEY];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function hasUsername(user: User | null): boolean {
  return getUsernameFromUser(user) !== null;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(input: string): string | null {
  const normalized = normalizeUsername(input);

  if (!normalized) {
    return 'Choose a username to continue.';
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use 3–20 characters: lowercase letters, numbers, and underscores only.';
  }

  return null;
}

