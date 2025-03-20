import Purchases from 'react-native-purchases';

import { Platform } from 'react-native';

import { User } from 'firebase/auth';

export const offeringNames = [
  '$rc_annual',
  '$rc_monthly',
];

export const entitlementIdentifiers = [
  'pro',
];

type SubscriptionPeriodMap = {
  [key: string]: string;
};

export const subscriptionPeriodMap: SubscriptionPeriodMap = {
  P1M: 'Monthly',
  P1Y: 'Annual',
};

export const loginBillingUser = async (firebaseUser: User) => {
  await Purchases.logIn(firebaseUser.uid);

  Purchases.setAttributes({
    $email: firebaseUser.email,
    $displayName: firebaseUser.displayName,
    firebaseUID: firebaseUser.uid,
    $device: Platform.OS,
  });
};

export const checkEntitlementStatus = async (entitlementIdentifier: string): Promise<boolean> => {
  const customerInfo = await Purchases.getCustomerInfo();

  return typeof customerInfo.entitlements.active[entitlementIdentifier] !== 'undefined';
};

export const checkIfProUser = async (): Promise<boolean> => checkEntitlementStatus('pro');

export const getOffering = async () => (await Purchases.getOfferings()).current;

export async function promptPurchase(
  packageIdentifier: string,
): Promise<boolean> {
  const offering = await getOffering();

  if (!offering) {
    console.error('Offering not found');
    return false;
  }

  const productToBuy = offering.availablePackages.find(
    (p) => p.identifier === packageIdentifier,
  )?.product;

  if (!productToBuy) {
    console.warn('Product not found');
    return false;
  }
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(productToBuy);
    if (
      typeof customerInfo.entitlements.active.my_entitlement_identifier
      !== 'undefined'
    ) {
      // TODO: Unlock that great "pro" content
      console.log('Pro content unlocked');
    }
  } catch (e: any) {
    if (!e?.userCancelled) {
      console.error(e);
    } else {
      console.log('User cancelled');
    }
  }

  return true;
}

export default {
  offeringNames,
  entitlementIdentifiers,
  subscriptionPeriodMap,
  loginBillingUser,
  checkEntitlementStatus,
  checkIfProUser,
  getOffering,
  promptPurchase,
};
