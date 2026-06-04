import * as SecureStore from '~/lib/storage/secure-store';

const REFERRAL_CODE_KEY = 'hedge.referral_code';

export async function getStoredReferralCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFERRAL_CODE_KEY);
  } catch {
    return null;
  }
}

export async function setStoredReferralCode(code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(REFERRAL_CODE_KEY);
    return;
  }
  await SecureStore.setItemAsync(REFERRAL_CODE_KEY, trimmed);
}
