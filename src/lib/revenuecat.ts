import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

export const LIFETIME_ENTITLEMENT_ID = 'lifetime';
export const LIFETIME_PRODUCT_ID = Platform.select({
  ios: 'nz.mediary.app.lifetime',
  android: 'lifetime_access',
  default: 'lifetime_access',
});

let configured = false;

/**
 * Configure the RevenueCat SDK once per app session and attach the
 * authenticated Supabase user id as RevenueCat's app_user_id. This is what
 * lets Lifetime Access follow the Mediary account across devices rather
 * than being tied to an anonymous RevenueCat identity (section 68).
 */
export function configureRevenueCat(supabaseUserId: string): void {
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

  if (!apiKey || apiKey.includes('placeholder')) {
    // Expected default state until real keys are configured (see .env.example)
    // — not warn-level, since this fires on every dev boot until then.
    console.log('RevenueCat API key missing — purchases are disabled until EXPO_PUBLIC_REVENUECAT_API_KEY_* is set.');
    return;
  }

  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey, appUserID: supabaseUserId });
    configured = true;
  } else {
    // Switching accounts (e.g. sign out then sign in as someone else).
    void Purchases.logIn(supabaseUserId);
  }
}

export function resetRevenueCatIdentity(): void {
  if (configured) void Purchases.logOut();
}

export function hasLifetimeEntitlement(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[LIFETIME_ENTITLEMENT_ID]);
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('Failed to fetch RevenueCat customer info', err);
    return null;
  }
}

export async function purchaseLifetimeAccess(): Promise<CustomerInfo> {
  const offerings = await Purchases.getOfferings();
  const pkg =
    offerings.current?.lifetime ??
    offerings.current?.availablePackages.find((p) => p.product.identifier === LIFETIME_PRODUCT_ID);

  if (!pkg) {
    throw new Error('Lifetime Access is not available right now. Please try again shortly.');
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
