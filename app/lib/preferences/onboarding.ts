import * as SecureStore from "~/lib/storage/secure-store";

const ONBOARDING_DONE_KEY = "hedge.onboarding_done";

export async function getOnboardingDone(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ONBOARDING_DONE_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, "1");
}
